using MyFlightbook;
using MyFlightbook.Currency;
using MyFlightbook.Instruction;
using System;
using System.Linq;
using System.Web.Mvc;

/******************************************************
 *
 * Copyright (c) 2007-2025 MyFlightbook LLC
 * Contact myflightbook-at-gmail.com for more information
 *
*******************************************************/

namespace MyFlightbook.Web.Areas.api.Controllers
{
    /// <summary>
    /// Pilot currency REST endpoint.
    ///
    /// GET /api/v1/currency          — currency items for the current user
    /// GET /api/v1/currency?user=x   — currency for another user (admin or instructor only)
    /// </summary>
    [Authorize]
    public class CurrencyController : ApiControllerBase
    {
        [HttpGet]
        public ActionResult Index(string user = null)
        {
            return SafeApiOp(() =>
            {
                string targetUser = string.IsNullOrEmpty(user) ? User.Identity.Name : user;

                // Only allow viewing another user's currency if admin or instructor
                if (string.Compare(targetUser, User.Identity.Name, StringComparison.OrdinalIgnoreCase) != 0)
                {
                    MyFlightbook.Profile pfViewer = MyFlightbook.Profile.GetUser(User.Identity.Name);
                    bool isAdmin = pfViewer.CanSupport && GetIntParam("a", 0) == 1;
                    bool isInstructor = CFIStudentMap.GetInstructorStudent(
                        new CFIStudentMap(User.Identity.Name).Students, targetUser)?.CanViewLogbook ?? false;

                    if (!isAdmin && !isInstructor)
                        throw new UnauthorizedAccessException(Resources.LogbookEntry.errNotAuthorizedToViewLogbook);
                }

                var items = CurrencyStatusItem.GetCurrencyItemsForUser(targetUser);

                return items.Select(csi => new
                {
                    attribute = csi.Attribute,
                    value = csi.Value,
                    status = csi.Status.ToString(),
                    discrepancy = csi.Discrepancy,
                    query = csi.Query == null ? null : csi.Query.ToBase64CompressedJSONString()
                });
            });
        }
    }
}
