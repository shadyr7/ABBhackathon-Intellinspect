using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Net.Http;
using Newtonsoft.Json;
using System.Text;
using System.IO;
using Intellinspect.Backend.Models;
using System.Collections.Generic;

namespace Intellinspect.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulationController : ControllerBase
    {
        private static readonly HttpClient _httpClient = new HttpClient();

        [HttpPost("start")]
        public async Task StartSimulation([FromBody] DateRangeRequest request)
        {
            var mlServiceUrl = "http://ml-service:8000/simulate";
            var jsonPayload = JsonConvert.SerializeObject(request);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, mlServiceUrl) { Content = content };
            
            // Critical: Set headers for streaming
            Response.Headers.Add("Content-Type", "text/event-stream");
            Response.Headers.Add("Cache-Control", "no-cache");
            Response.Headers.Add("Connection", "keep-alive");

            using (var response = await _httpClient.SendAsync(httpRequestMessage, HttpCompletionOption.ResponseHeadersRead))
            {
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    await Response.Body.WriteAsync(Encoding.UTF8.GetBytes($"data: {{\"error\": \"{errorBody}\"}}\n\n"));
                    return;
                }

                using (var stream = await response.Content.ReadAsStreamAsync())
                using (var reader = new StreamReader(stream))
                {
                    while (!reader.EndOfStream)
                    {
                        var line = await reader.ReadLineAsync();
                        if (!string.IsNullOrEmpty(line))
                        {
                            // Forward each line from the Python service to the client browser
                            await Response.WriteAsync(line + "\n");
                            await Response.Body.FlushAsync();
                        }
                    }
                }
            }
        }
    }
}