using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using MeetingApp.API.Models.Business;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MeetingApp.API.Services
{
    public class OutlookCalendarService
    {
        private readonly ILogger<OutlookCalendarService> _logger;
        private readonly GraphServiceClient? _graphClient;
        private readonly string _tenantId;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly bool _isConfigured;

        public OutlookCalendarService(IConfiguration configuration, ILogger<OutlookCalendarService> logger)
        {
            _logger = logger;
            _tenantId = configuration["AzureAd:TenantId"] ?? "";
            _clientId = configuration["AzureAd:ClientId"] ?? "";
            _clientSecret = configuration["AzureAd:ClientSecret"] ?? "";

            // Check if placeholders or empty
            _isConfigured = !string.IsNullOrWhiteSpace(_clientId) && 
                            _clientId != "YOUR_CLIENT_ID" &&
                            !string.IsNullOrWhiteSpace(_tenantId) &&
                            _tenantId != "YOUR_TENANT_ID" &&
                            !string.IsNullOrWhiteSpace(_clientSecret) &&
                            _clientSecret != "YOUR_CLIENT_SECRET";

            if (_isConfigured)
            {
                var options = new TokenCredentialOptions { AuthorityHost = AzureAuthorityHosts.AzurePublicCloud };
                var clientSecretCredential = new ClientSecretCredential(_tenantId, _clientId, _clientSecret, options);
                var scopes = new[] { "https://graph.microsoft.com/.default" };
                _graphClient = new GraphServiceClient(clientSecretCredential, scopes);
                _logger.LogInformation("OutlookCalendarService initialized with Azure AD credentials.");
            }
            else
            {
                _logger.LogWarning("OutlookCalendarService is running in placeholder mode. Real Outlook integration will not be performed.");
            }
        }

        public async Task<string?> CreateMeetingAsync(Meeting meeting, List<string> attendeeEmails)
        {
            if (!_isConfigured || _graphClient == null)
            {
                _logger.LogInformation($"[Placeholder] Would create Outlook Meeting: {meeting.Title} on {meeting.MeetingDate}");
                return "placeholder-event-id-" + Guid.NewGuid().ToString();
            }

            try
            {
                var targetUserId = "admin@yourdomain.com"; // Placeholder target user

                var attendees = new List<Attendee>();
                foreach (var email in attendeeEmails)
                {
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        attendees.Add(new Attendee
                        {
                            EmailAddress = new EmailAddress { Address = email, Name = email },
                            Type = AttendeeType.Required
                        });
                    }
                }

                var requestBody = new Event
                {
                    Subject = meeting.Title,
                    Body = new ItemBody
                    {
                        ContentType = BodyType.Html,
                        Content = meeting.Description ?? "No description"
                    },
                    Start = new DateTimeTimeZone
                    {
                        DateTime = meeting.MeetingDate.ToDateTime(new TimeOnly(0,0)).ToString("yyyy-MM-ddTHH:mm:ss"),
                        TimeZone = "Europe/Istanbul"
                    },
                    End = new DateTimeTimeZone
                    {
                        DateTime = meeting.MeetingDate.ToDateTime(new TimeOnly(1,0)).ToString("yyyy-MM-ddTHH:mm:ss"),
                        TimeZone = "Europe/Istanbul"
                    },
                    Location = new Microsoft.Graph.Models.Location
                    {
                        DisplayName = "Toplantı Odası"
                    },
                    Attendees = attendees
                };

                var createdEvent = await _graphClient.Users[targetUserId].Events.PostAsync(requestBody);
                return createdEvent?.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create Outlook event via Graph API.");
                return null;
            }
        }

        public async Task UpdateMeetingAsync(string eventId, Meeting meeting)
        {
            if (!_isConfigured || _graphClient == null)
            {
                _logger.LogInformation($"[Placeholder] Would update Outlook Meeting {eventId} with title: {meeting.Title}");
                return;
            }

            try
            {
                var targetUserId = "admin@yourdomain.com";
                var requestBody = new Event
                {
                    Subject = meeting.Title,
                    Start = new DateTimeTimeZone
                    {
                        DateTime = meeting.MeetingDate.ToDateTime(new TimeOnly(0,0)).ToString("yyyy-MM-ddTHH:mm:ss"),
                        TimeZone = "Europe/Istanbul"
                    },
                    End = new DateTimeTimeZone
                    {
                        DateTime = meeting.MeetingDate.ToDateTime(new TimeOnly(1,0)).ToString("yyyy-MM-ddTHH:mm:ss"),
                        TimeZone = "Europe/Istanbul"
                    }
                };

                await _graphClient.Users[targetUserId].Events[eventId].PatchAsync(requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update Outlook event {eventId}.");
            }
        }

        public async Task DeleteMeetingAsync(string eventId)
        {
            if (!_isConfigured || _graphClient == null)
            {
                _logger.LogInformation($"[Placeholder] Would delete Outlook Meeting {eventId}");
                return;
            }

            try
            {
                var targetUserId = "admin@yourdomain.com";
                await _graphClient.Users[targetUserId].Events[eventId].DeleteAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to delete Outlook event {eventId}.");
            }
        }
    }
}
