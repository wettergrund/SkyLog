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
    /// Aircraft REST endpoints.
    ///
    /// GET    /api/v1/aircraft         — list all aircraft for the current user
    /// GET    /api/v1/aircraft/{id}    — single aircraft by ID
    /// DELETE /api/v1/aircraft/{id}    — remove aircraft from the user's account
    ///
    /// GET /api/v1/aircraft query params:
    ///   includeImages — bool (default false)
    ///   includeStats  — bool; populate flight-count stats (default false, slightly slower)
    /// </summary>
    [Authorize]
    public class AircraftController : ApiControllerBase
    {
        // ─── GET /api/v1/aircraft ─────────────────────────────────────────────

        [HttpGet]
        public ActionResult Index(bool includeImages = false, bool includeStats = false)
        {
            return SafeApiOp(() =>
            {
                UserAircraft ua = new UserAircraft(User.Identity.Name);
                IEnumerable<Aircraft> aircraft = ua.GetAircraftForUser();

                if (includeStats)
                    AircraftStats.PopulateStatsForAircraft(aircraft, User.Identity.Name);

                if (includeImages)
                {
                    foreach (Aircraft ac in aircraft)
                        ac.PopulateImages();
                }

                return aircraft.Select(ac => AircraftDto(ac, includeStats));
            });
        }

        // ─── GET /api/v1/aircraft/{id} ────────────────────────────────────────

        [HttpGet]
        public ActionResult Index(int id, bool includeImages = false)
        {
            return SafeApiOp(() =>
            {
                UserAircraft ua = new UserAircraft(User.Identity.Name);
                Aircraft ac = ua[id];

                if (ac == null)
                    throw new UnauthorizedAccessException("Aircraft not found in your account.");

                if (includeImages)
                    ac.PopulateImages();

                return AircraftDto(ac, includeImages: includeImages);
            });
        }

        // ─── DELETE /api/v1/aircraft/{id} ────────────────────────────────────

        [HttpDelete]
        public ActionResult Index(int id)
        {
            return SafeApiOp(() =>
            {
                UserAircraft ua = new UserAircraft(User.Identity.Name);
                Aircraft ac = ua[id];
                if (ac == null)
                    throw new UnauthorizedAccessException("Aircraft not found in your account.");

                ua.FDeleteAircraftforUser(id);
            });
        }

        // ─── Helpers ─────────────────────────────────────────────────────────

        private static object AircraftDto(Aircraft ac, bool includeStats = false, bool includeImages = false)
        {
            return new
            {
                aircraftID = ac.AircraftID,
                tailNumber = ac.TailNumber,
                tailNumberDisplay = ac.DisplayTailnumber,
                modelID = ac.ModelID,
                modelDisplay = ac.ModelDescription,
                instanceType = ac.InstanceType.ToString(),
                isRegistered = ac.IsRegistered,
                hideFromSelection = ac.HideFromSelection,
                role = ac.RoleForPilot.ToString(),
                publicNotes = ac.PublicNotes,
                privateNotes = ac.PrivateNotes,
                defaultImage = ac.DefaultImage,
                avionicsTechnology = ac.AvionicsTechnologyUpgrade.ToString(),
                glassUpgradeDate = ac.GlassUpgradeDate,
                flightCount = includeStats ? (int?)ac.Stats?.UserFlights : null,
                images = (includeImages && ac.ImagesHaveBeenFilled)
                    ? ac.AircraftImages?.Select(img => new
                    {
                        thumbnail = img.URLThumbnail,
                        full = img.URLFullImage,
                        comment = img.Comment
                    })
                    : null,
                maintenance = ac.IsRegistered
                    ? new
                    {
                        lastAnnual = ac.Maintenance.LastAnnual,
                        lastTransponder = ac.Maintenance.LastTransponder,
                        lastStatic = ac.Maintenance.LastStatic,
                        lastAltimeter = ac.Maintenance.LastAltimeter,
                        lastELT = ac.Maintenance.LastELT,
                        lastVOR = ac.Maintenance.LastVOR,
                        registrationExpiration = ac.Maintenance.RegistrationExpiration,
                        last100 = ac.Maintenance.Last100,
                        lastOilChange = ac.Maintenance.LastOilChange,
                        lastNewEngine = ac.Maintenance.LastNewEngine,
                        notes = ac.Maintenance.Notes
                    }
                    : null
            };
        }
    }
}
