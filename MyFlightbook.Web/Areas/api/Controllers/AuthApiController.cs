using MyFlightbook;
using System;
using System.Globalization;
using System.Web.Mvc;
using System.Web.Security;

/******************************************************
 *
 * Copyright (c) 2007-2025 MyFlightbook LLC
 * Contact myflightbook-at-gmail.com for more information
 *
*******************************************************/

namespace MyFlightbook.Web.Areas.api.Controllers
{
    /// <summary>
    /// Authentication endpoints for the React SPA.
    ///
    /// POST /api/v1/auth/login    — sign in, sets forms-auth cookie
    /// POST /api/v1/auth/logout   — sign out, clears cookie
    /// GET  /api/v1/auth/me       — returns current user profile (requires auth)
    /// </summary>
    public class AuthController : ApiControllerBase
    {
        /// <summary>
        /// Signs the user in and sets the .ASPXAUTH cookie.
        /// Body (form-encoded or JSON-bound): email, password, tfaCode (optional), rememberMe (bool)
        /// Returns the current user's profile on success.
        /// </summary>
        [HttpPost]
        public ActionResult Login(string email, string password, string tfaCode = null, bool rememberMe = false)
        {
            return SafeApiOp(() =>
            {
                if (string.IsNullOrWhiteSpace(email))
                    throw new ArgumentException(Resources.Profile.errEmailRequired);
                if (string.IsNullOrWhiteSpace(password))
                    throw new ArgumentException(Resources.Profile.errInvalidPassword);

                // Resolve username from email
                string userName = Membership.GetUserNameByEmail(email);

                // Apple sends "+" as a space — handle this edge case.
                if (string.IsNullOrEmpty(userName) && email.Contains(" "))
                    userName = Membership.GetUserNameByEmail(email.Replace(' ', '+'));

                if (string.IsNullOrEmpty(userName) || !Membership.ValidateUser(userName, password))
                    throw new UnauthorizedAccessException(Resources.Profile.errInvalidPassword);

                MyFlightbook.Profile pf = MyFlightbook.Profile.GetUser(userName);

                // Check 2FA if configured
                if (pf.PreferenceExists(MFBConstants.keyTFASettings))
                {
                    if (string.IsNullOrEmpty(tfaCode))
                        throw new UnauthorizedAccessException("TFARequired");  // React can detect this string and show the TFA field

                    if (!Check2FA(pf, tfaCode))
                        throw new UnauthorizedAccessException(Resources.Profile.TFACodeFailed);
                }

                FormsAuthentication.SetAuthCookie(userName, rememberMe);

                // Store decimal/rounding prefs in session (matches existing auth controller behaviour)
                Session[MFBConstants.keyDecimalSettings] = pf.PreferenceExists(MFBConstants.keyDecimalSettings)
                    ? pf.GetPreferenceForKey<DecimalFormat>(MFBConstants.keyDecimalSettings)
                    : (object)null;
                Session[MFBConstants.keyMathRoundingUnits] = pf.MathRoundingUnit;

                return BuildUserDto(pf);
            });
        }

        /// <summary>
        /// Signs the user out and clears the auth cookie.
        /// </summary>
        [HttpPost]
        [Authorize]
        public ActionResult Logout()
        {
            return SafeApiOp(() =>
            {
                FormsAuthentication.SignOut();
                Session.Clear();
            });
        }

        /// <summary>
        /// Returns profile information for the currently authenticated user.
        /// </summary>
        [HttpGet]
        [Authorize]
        public ActionResult Me()
        {
            return SafeApiOp(() =>
            {
                MyFlightbook.Profile pf = MyFlightbook.Profile.GetUser(User.Identity.Name);
                return BuildUserDto(pf);
            });
        }

        // DTO — only expose what the React frontend needs
        private static object BuildUserDto(MyFlightbook.Profile pf)
        {
            return new
            {
                userName = pf.UserName,
                email = pf.Email,
                firstName = pf.FirstName,
                lastName = pf.LastName,
                fullName = pf.UserFullName,
                usesHHMM = pf.UsesHHMM,
                preferredTimeZone = pf.PreferredTimeZone?.Id,
                currencyJurisdiction = pf.CurrencyJurisdiction.ToString(),
                totalsGrouping = pf.TotalsGroupingMode.ToString(),
                isInstructor = pf.IsInstructor,
                canSupport = pf.CanSupport,
                canManageData = pf.CanManageData,
                headShotHref = string.IsNullOrEmpty(pf.UserName) ? null
                    : string.Format(CultureInfo.InvariantCulture, "~/mvc/Image/HeadShot/{0}", pf.UserName).ToAbsolute()
            };
        }
    }
}
