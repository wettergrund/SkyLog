using System;
using System.Web.Mvc;

/******************************************************
 *
 * Copyright (c) 2007-2025 MyFlightbook LLC
 * Contact myflightbook-at-gmail.com for more information
 *
*******************************************************/

namespace MyFlightbook.Web.Areas.api
{
    public class ApiAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get { return "api"; }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            if (context == null)
                throw new ArgumentNullException(nameof(context));

            // RESTful-style routes: api/v1/{controller}/{id}
            context.MapRoute(
                "api_withid",
                "api/v1/{controller}/{id}",
                new { action = "Index", id = UrlParameter.Optional },
                new { id = @"\d+" }
            );

            // Action-style routes: api/v1/{controller}/{action}
            context.MapRoute(
                "api_default",
                "api/v1/{controller}/{action}",
                new { action = "Index" }
            );
        }
    }
}
