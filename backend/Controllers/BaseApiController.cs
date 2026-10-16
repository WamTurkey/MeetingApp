using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace MeetingApp.API.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// JWT token'daki ClaimTypes.NameIdentifier (User Id) değerini döner.
    /// Token yoksa veya parse edilemezse geriye 1 (Sistem kullanıcısı) döner.
    /// </summary>
    protected int CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out var id) && id > 0)
                return id;
            return 1;
        }
    }
}
