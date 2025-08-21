using Microsoft.AspNetCore.Mvc;
using Intellinspect.Backend.Services;
using Intellinspect.Backend.Models;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net.Http;
using Newtonsoft.Json;

namespace Intellinspect.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DateRangesController : ControllerBase
    {
        private readonly DatasetService _datasetService;
        private static readonly HttpClient _httpClient = new HttpClient();

        public DateRangesController(DatasetService datasetService)
        {
            _datasetService = datasetService;
        }

        [HttpPost("validate")]
        public IActionResult ValidateRanges([FromBody] DateRangeRequest request)
        {
            if (!request.TrainingStart.HasValue || !request.TrainingEnd.HasValue ||
                !request.TestingStart.HasValue || !request.TestingEnd.HasValue ||
                !request.SimulationStart.HasValue || !request.SimulationEnd.HasValue)
            {
                return BadRequest(new { message = "All six date fields must be selected." });
            }
            
            var records = _datasetService.Records;
            if (records.Count == 0) return BadRequest(new { message = "No dataset found." });

            var datasetStartDate = ((DateTime)records.First()["synthetic_timestamp"]).Date;
            var datasetEndDate = ((DateTime)records.Last()["synthetic_timestamp"]).Date;

            var trainingStartDate = request.TrainingStart.Value.Date;
            var trainingEndDate = request.TrainingEnd.Value.Date;
            var testingStartDate = request.TestingStart.Value.Date;
            var testingEndDate = request.TestingEnd.Value.Date;
            var simulationStartDate = request.SimulationStart.Value.Date;
            var simulationEndDate = request.SimulationEnd.Value.Date;
            
            if (trainingStartDate > trainingEndDate || testingStartDate > testingEndDate || simulationStartDate > simulationEndDate)
                return BadRequest(new { message = "Start date cannot be after end date." });
            if (testingStartDate <= trainingEndDate)
                return BadRequest(new { message = "Testing period must start after training ends." });
            if (simulationStartDate <= testingEndDate)
                return BadRequest(new { message = "Simulation period must start after testing ends." });
            if (trainingStartDate < datasetStartDate || simulationEndDate > datasetEndDate)
                return BadRequest(new { message = $"Dates must be within {datasetStartDate:yyyy-MM-dd} to {datasetEndDate:yyyy-MM-dd}." });

            Func<DateTime, bool> inTraining = ts => ts.Date >= trainingStartDate && ts.Date <= trainingEndDate;
            Func<DateTime, bool> inTesting = ts => ts.Date >= testingStartDate && ts.Date <= testingEndDate;
            Func<DateTime, bool> inSimulation = ts => ts.Date >= simulationStartDate && ts.Date <= simulationEndDate;

            var response = new ValidationResponse
            {
                Status = "Valid",
                Message = "Date ranges validated successfully!",
                TrainingDurationDays = (trainingEndDate - trainingStartDate).Days + 1,
                TestingDurationDays = (testingEndDate - testingStartDate).Days + 1,
                SimulationDurationDays = (simulationEndDate - simulationStartDate).Days + 1,
                TrainingRecordCount = records.Count(r => inTraining((DateTime)r["synthetic_timestamp"])),
                TestingRecordCount = records.Count(r => inTesting((DateTime)r["synthetic_timestamp"])),
                SimulationRecordCount = records.Count(r => inSimulation((DateTime)r["synthetic_timestamp"])),
                MonthlyRecordCounts = records.GroupBy(r => ((DateTime)r["synthetic_timestamp"]).ToString("yyyy-MM")).ToDictionary(g => g.Key, g => g.Count())
            };
            return Ok(response);
        }

        [HttpPost("train-model")]
        public async Task<IActionResult> TrainModel([FromBody] DateRangeRequest request)
        {
            if (_datasetService.Records == null || _datasetService.Records.Count == 0)
                return BadRequest(new { message = "No dataset loaded." });
            if (!request.TrainingStart.HasValue || !request.TestingEnd.HasValue)
                return BadRequest(new { message = "Valid training and testing dates required." });

            try
            {
                var trainingStartDate = request.TrainingStart.Value.Date;
                var trainingEndDate = request.TrainingEnd.Value.Date;
                var testingStartDate = request.TestingStart.Value.Date;
                var testingEndDate = request.TestingEnd.Value.Date;
        
                var trainingData = _datasetService.Records
                    .Where(r => ((DateTime)r["synthetic_timestamp"]).Date >= trainingStartDate && ((DateTime)r["synthetic_timestamp"]).Date <= trainingEndDate).ToList();
                var testingData = _datasetService.Records
                    .Where(r => ((DateTime)r["synthetic_timestamp"]).Date >= testingStartDate && ((DateTime)r["synthetic_timestamp"]).Date <= testingEndDate).ToList();

                if (trainingData.Count == 0 || testingData.Count == 0)
                    return BadRequest(new { message = "Date ranges resulted in zero records." });

                var mlServiceUrl = "http://ml-service:8000/train";
                var mlRequestPayload = new { trainingData, testingData };
                var jsonPayload = JsonConvert.SerializeObject(mlRequestPayload);
                var content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(mlServiceUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new { message = $"ML Service Error: {errorContent}" });
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var mlResponse = JsonConvert.DeserializeObject<TrainingResponse>(responseBody);
                return Ok(mlResponse);
            }
            catch (Exception e)
            {
                return StatusCode(500, new { message = $"Error: {e.Message}" });
            }
        }
    }
}