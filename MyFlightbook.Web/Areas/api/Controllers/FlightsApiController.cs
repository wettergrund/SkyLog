using MyFlightbook;
using MyFlightbook.Web.Sharing;
using System;
using System.Collections.Generic;
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
    /// Flight logbook REST endpoints.
    ///
    /// GET    /api/v1/flights              — paginated list of flights for the current user
    /// GET    /api/v1/flights/{id}         — single flight by ID
    /// DELETE /api/v1/flights/{id}         — delete a single flight
    /// POST   /api/v1/flights/delete       — batch-delete (body: { ids: [1,2,3] })
    ///
    /// Query parameters for GET /api/v1/flights:
    ///   fq        — base-64 compressed JSON FlightQuery (optional; defaults to all flights)
    ///   skip      — offset for pagination (default 0)
    ///   limit     — page size (default 25, max 100)
    ///   sortKey   — sort field name (default: date)
    ///   sortDir   — "Ascending" | "Descending" (default: Descending)
    ///   skID      — share-key ID for public/shared logbook access (optional)
    /// </summary>
    [Authorize]
    public class FlightsController : ApiControllerBase
    {
        private const int DefaultPageSize = 25;
        private const int MaxPageSize = 100;

        // ─── GET /api/v1/flights ──────────────────────────────────────────────

        /// <summary>
        /// Returns a page of flights for the authenticated user (or a share-key target).
        /// Response data: { flights: [...], totalCount: N, skip: N, limit: N }
        /// </summary>
        [HttpGet]
        public ActionResult Index(
            string fq = null,
            int skip = 0,
            int limit = DefaultPageSize,
            string sortKey = null,
            SortDirection sortDir = SortDirection.Descending,
            string skID = null)
        {
            return SafeApiOp(() =>
            {
                limit = Math.Max(1, Math.Min(limit, MaxPageSize));
                skip = Math.Max(0, skip);

                // Resolve the query — default to all flights for the current user
                FlightQuery query = string.IsNullOrEmpty(fq)
                    ? new FlightQuery(User.Identity.Name)
                    : FlightQuery.FromBase64CompressedJSON(fq);

                // Share-key access: unauthenticated viewing via share key
                ShareKey sk = string.IsNullOrEmpty(skID) ? null : ShareKey.ShareKeyWithID(skID);

                // Authorization check
                CheckCanViewFlightsForApi(query.UserName, sk);

                FlightResult fr = FlightResultManager.FlightResultManagerForUser(query.UserName).ResultsForQuery(query);

                string resolvedSortKey = sortKey ?? fr.CurrentSortKey;
                FlightResultRange range = fr.GetResultRange(limit, FlightRangeType.Page, resolvedSortKey, sortDir, skip / limit);

                IEnumerable<LogbookEntryDisplay> flights = fr.FlightsInRange(range)
                    .OfType<LogbookEntryDisplay>();

                return new
                {
                    flights = flights.Select(f => FlightDto(f)),
                    totalCount = fr.FlightCount,
                    skip,
                    limit,
                    sortKey = resolvedSortKey,
                    sortDir = sortDir.ToString()
                };
            });
        }

        // ─── GET /api/v1/flights/{id} ────────────────────────────────────────

        /// <summary>
        /// Returns a single flight by ID, including images if requested.
        /// Query params: includeImages (bool), includeTelemetry (bool)
        /// </summary>
        [HttpGet]
        public ActionResult Index(int id, bool includeImages = false, bool includeTelemetry = false)
        {
            return SafeApiOp(() =>
            {
                LogbookEntryDisplay led = new LogbookEntryDisplay(
                    id,
                    User.Identity.Name,
                    includeTelemetry ? LogbookEntryCore.LoadTelemetryOption.LoadAll : LogbookEntryCore.LoadTelemetryOption.None);

                if (led.IsNewFlight)
                    throw new UnauthorizedAccessException(Resources.LogbookEntry.errNoSuchFlight);

                // Only the owner (or admin) may retrieve via this endpoint
                if (led.User.CompareCurrentCulture(User.Identity.Name) != 0)
                {
                    MyFlightbook.Profile pfViewer = MyFlightbook.Profile.GetUser(User.Identity.Name);
                    if (!pfViewer.CanSupport)
                        throw new UnauthorizedAccessException(Resources.LogbookEntry.errNotAuthorizedToViewLogbook);
                }

                if (includeImages)
                    led.PopulateImages();

                return FlightDto(led, includeImages);
            });
        }

        // ─── DELETE /api/v1/flights/{id} ─────────────────────────────────────

        [HttpDelete]
        public ActionResult Index(int id)
        {
            return SafeApiOp(() =>
            {
                if (!LogbookEntryBase.FDeleteEntry(id, User.Identity.Name))
                    throw new UnauthorizedAccessException();
            });
        }

        // ─── POST /api/v1/flights/delete (batch) ────────────────────────────

        /// <summary>
        /// Deletes multiple flights by ID.
        /// Body: { "ids": [1, 2, 3] }
        /// </summary>
        [HttpPost]
        public ActionResult Delete(int[] ids)
        {
            return SafeApiOp(() =>
            {
                if (ids == null || ids.Length == 0)
                    throw new ArgumentException("No flight IDs provided.");

                foreach (int id in ids)
                {
                    if (!LogbookEntryBase.FDeleteEntry(id, User.Identity.Name))
                        throw new UnauthorizedAccessException($"Flight {id} could not be deleted.");
                }
            });
        }

        // ─── Helpers ─────────────────────────────────────────────────────────

        /// <summary>
        /// Authorization check that mirrors FlightControllerBase.CheckCanViewFlights
        /// but is usable from the API area without inheriting from FlightControllerBase.
        /// </summary>
        private void CheckCanViewFlightsForApi(string targetUser, ShareKey sk)
        {
            // Share-key access (unauthenticated is OK if key grants canViewFlights)
            if ((sk?.CanViewFlights ?? false) &&
                string.Compare(sk.Username, targetUser, StringComparison.OrdinalIgnoreCase) == 0)
                return;

            if (User.Identity.IsAuthenticated)
            {
                if (string.Compare(targetUser, User.Identity.Name, StringComparison.OrdinalIgnoreCase) == 0)
                    return; // own flights

                MyFlightbook.Profile pfViewer = MyFlightbook.Profile.GetUser(User.Identity.Name);
                if (pfViewer.CanSupport && GetIntParam("a", 0) == 1)
                    return; // admin mode
            }

            throw new UnauthorizedAccessException(Resources.LogbookEntry.errNotAuthorizedToViewLogbook);
        }

        /// <summary>
        /// Projects a LogbookEntryDisplay to a plain DTO object for JSON serialization.
        /// </summary>
        private static object FlightDto(LogbookEntryDisplay led, bool includeImages = false)
        {
            var dto = new
            {
                flightID = led.FlightID,
                date = led.Date,
                aircraftID = led.AircraftID,
                tailNumber = led.TailNumDisplay,
                modelDisplay = led.ModelDisplay,
                route = led.Route,
                comment = led.Comment,
                totalFlightTime = led.TotalFlightTime,
                pic = led.PIC,
                sic = led.SIC,
                dual = led.Dual,
                cfi = led.CFI,
                crossCountry = led.CrossCountry,
                nighttime = led.Nighttime,
                imc = led.IMC,
                simulatedIFR = led.SimulatedIFR,
                groundSim = led.GroundSim,
                approaches = led.Approaches,
                landings = led.Landings,
                fullStopLandings = led.FullStopLandings,
                nightLandings = led.NightLandings,
                hobbsStart = led.HobbsStart,
                hobbsEnd = led.HobbsEnd,
                engineStart = led.EngineStart,
                engineEnd = led.EngineEnd,
                flightStart = led.FlightStart,
                flightEnd = led.FlightEnd,
                isPublic = led.fIsPublic,
                hasFlightData = led.HasFlightData,
                isSigned = led.CFISignatureState == LogbookEntry.SignatureState.Valid,
                customProperties = led.CustomProperties?.Select(cfp => new
                {
                    propertyTypeID = cfp.PropTypeID,
                    caption = cfp.PropertyType?.Title,
                    value = cfp.ValueString
                }),
                images = includeImages
                    ? led.FlightImages?.Select(img => new
                    {
                        thumbnail = img.URLThumbnail,
                        full = img.URLFullImage,
                        comment = img.Comment
                    })
                    : null
            };
            return dto;
        }
    }
}
