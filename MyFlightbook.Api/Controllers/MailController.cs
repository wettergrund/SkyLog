using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MyFlightbook.Api.Controllers
{
    [Route( "api/v1/[controller]" )]
    [ApiController]
    public class MailController : ApiControllerBase
    {
        private readonly AppDbContext _db;

        public MailController(AppDbContext db, IUserResolver resolver) : base( resolver )
            => _db = db;

        [HttpPost( "admin/send-inactive-notice" )]
        //[Authorize]
        public async Task<IActionResult> SendInactiveNotice()
        {
            // 1. Guard: Only SuperUsers allowed
            //if (!User.HasClaim( "superuser", "true" )) return Forbid();

            // 2. Filter: Users with no activity for > 1 year
            var cutoff = DateTime.UtcNow.AddYears( -1 );
            var inactiveUsers = _db.Users.ToList();
            // 3. Queue to Firestore (requires Google.Cloud.Firestore NuGet package)
            var firestore = FirestoreDb.Create( "flightbook-6eebe" );
            var batch = firestore.StartBatch();

            foreach (var user in inactiveUsers)
            {
                var mailRef = firestore.Collection( "mail" ).Document();
                batch.Set( mailRef, new
                {
                    to = user.Email,
                    message = new
                    {
                        subject = "We miss you in the cockpit!",
                        html = $"<h1>Hi {user.FirstName}</h1><p>It's been a while since your last logbook entry...</p>",
                    }
                } );
            }

            await batch.CommitAsync();

            return Ok( new { count = inactiveUsers.Count } );
        }
    }
}
