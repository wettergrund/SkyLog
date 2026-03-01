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
    /// Flight totals REST endpoint.
    ///
    /// GET /api/v1/totals             — totals for the current user (all flights)
    /// GET /api/v1/totals?fq=...      — totals scoped to a FlightQuery (base-64 compressed JSON)
    /// GET /api/v1/totals?user=x      — totals for another user (admin or instructor only)
    /// GET /api/v1/totals?grouped=true — group totals by category/class (default true)
    /// </summary>
    [Authorize]
    public class TotalsController : ApiControllerBase
    {
        [HttpGet]
        public ActionResult Index(string fq = null, string user = null, bool grouped = true)
        {
            return SafeApiOp(() =>
            {
                string targetUser = string.IsNullOrEmpty(user) ? User.Identity.Name : user;

                // Only allow viewing another user's totals if admin or instructor
                if (string.Compare(targetUser, User.Identity.Name, StringComparison.OrdinalIgnoreCase) != 0)
                {
                    MyFlightbook.Profile pfViewer = MyFlightbook.Profile.GetUser(User.Identity.Name);
                    bool isAdmin = pfViewer.CanSupport && GetIntParam("a", 0) == 1;
                    bool isInstructor = CFIStudentMap.GetInstructorStudent(
                        new CFIStudentMap(User.Identity.Name).Students, targetUser)?.CanViewLogbook ?? false;

                    if (!isAdmin && !isInstructor)
                        throw new UnauthorizedAccessException(Resources.LogbookEntry.errNotAuthorizedToViewLogbook);
                }

                FlightQuery query = string.IsNullOrEmpty(fq)
                    ? new FlightQuery(targetUser)
                    : FlightQuery.FromBase64CompressedJSON(fq);

                if (string.Compare(query.UserName, targetUser, StringComparison.OrdinalIgnoreCase) != 0)
                    throw new UnauthorizedAccessException("Query username does not match requested user.");

                UserTotals ut = new UserTotals(targetUser, query, true);
                ut.DataBind();

                bool useHHMM = MyFlightbook.Profile.GetUser(targetUser).UsesHHMM;

                return new
                {
                    grouped,
                    useHHMM,
                    totals = ut.Totals.Select(ti => new
                    {
                        description = ti.Description,
                        value = ti.Value,
                        numericType = ti.NumericType.ToString(),
                        group = ti.Group,
                        subDescription = ti.SubDescription,
                        query = ti.Query == null ? null : ti.Query.ToBase64CompressedJSONString()
                    })
                };
            });
        }
    }
}
