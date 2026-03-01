using MyFlightbook.Web.Areas.mvc.Controllers;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Net;
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
    /// Standard JSON envelope returned by all API endpoints.
    /// { "ok": true, "data": ... } on success
    /// { "ok": false, "error": "message" } on failure
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Ok { get; set; }
        public T Data { get; set; }
        public string Error { get; set; }
    }

    /// <summary>
    /// Base class for all REST API controllers in the api area.
    /// Inherits auth/impersonation helpers from AdminControllerBase.
    /// All responses are JSON with a consistent envelope.
    /// No [ValidateAntiForgeryToken] — this area is for SPA consumption on the same origin.
    /// CSRF protection comes from SameSite cookie policy on the forms-auth cookie.
    /// </summary>
    public class ApiControllerBase : AdminControllerBase
    {
        private static readonly JsonSerializerSettings s_jsonSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore,
            DateFormatHandling = DateFormatHandling.IsoDateFormat
        };

        /// <summary>
        /// Returns a 200 OK JSON response with the given data payload.
        /// </summary>
        protected ContentResult ApiOk<T>(T data)
        {
            var envelope = new ApiResponse<T> { Ok = true, Data = data };
            return Content(JsonConvert.SerializeObject(envelope, s_jsonSettings), "application/json");
        }

        /// <summary>
        /// Returns an error JSON response with the given HTTP status code.
        /// </summary>
        protected ContentResult ApiError(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        {
            Response.StatusCode = (int)statusCode;
            Response.TrySkipIisCustomErrors = true;
            var envelope = new ApiResponse<object> { Ok = false, Error = message };
            return Content(JsonConvert.SerializeObject(envelope, s_jsonSettings), "application/json");
        }

        /// <summary>
        /// Executes func inside a try/catch. Returns ApiError on any exception.
        /// </summary>
        protected ContentResult SafeApiOp<T>(Func<T> func)
        {
            if (func == null) throw new ArgumentNullException(nameof(func));
            try
            {
                if (ShuntState.IsShunted)
                    throw new MyFlightbookException(ShuntState.ShuntMessage);
                return ApiOk(func());
            }
            catch (UnauthorizedAccessException ex)
            {
                return ApiError(ex.Message, HttpStatusCode.Forbidden);
            }
            catch (Exception ex) when (!(ex is OutOfMemoryException))
            {
                return ApiError(ex.Message);
            }
        }

        /// <summary>
        /// Executes func inside a try/catch, returning void (empty data: null). Returns ApiError on any exception.
        /// </summary>
        protected ContentResult SafeApiOp(Action action)
        {
            if (action == null) throw new ArgumentNullException(nameof(action));
            try
            {
                if (ShuntState.IsShunted)
                    throw new MyFlightbookException(ShuntState.ShuntMessage);
                action();
                return ApiOk<object>(null);
            }
            catch (UnauthorizedAccessException ex)
            {
                return ApiError(ex.Message, HttpStatusCode.Forbidden);
            }
            catch (Exception ex) when (!(ex is OutOfMemoryException))
            {
                return ApiError(ex.Message);
            }
        }
    }
}
