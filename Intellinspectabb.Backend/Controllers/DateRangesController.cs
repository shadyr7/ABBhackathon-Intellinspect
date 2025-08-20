using Microsoft.AspNetCore.Mvc;
using Intellinspect.Backend.Services;
using Intellinspect.Backend.Models;
using Newtonsoft.Json;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System;
using System.Collections.Generic;

namespace Intellinspect.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DateRangesController : ControllerBase
    {
        private readonly DatasetService _datasetService;

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
            
            var response = new ValidationResponse();
            var records = _datasetService.Records;

            if (records.Count == 0)
            {
                response.Message = "No dataset found. Please upload a file first.";
                return BadRequest(response);
            }

            var datasetStartDate = ((DateTime)records.First()["synthetic_timestamp"]).Date;
            var datasetEndDate = ((DateTime)records.Last()["synthetic_timestamp"]).Date;

            var trainingStartDate = request.TrainingStart.Value.Date;
            var trainingEndDate = request.TrainingEnd.Value.Date;
            var testingStartDate = request.TestingStart.Value.Date;
            var testingEndDate = request.TestingEnd.Value.Date;
            var simulationStartDate = request.SimulationStart.Value.Date;
            var simulationEndDate = request.SimulationEnd.Value.Date;
            
            if (trainingStartDate > trainingEndDate || testingStartDate > testingEndDate || simulationStartDate > simulationEndDate)
            {
                response.Message = "Start date cannot be after the end date for any period.";
                return BadRequest(response);
            }
            if (testingStartDate <= trainingEndDate)
            {
                response.Message = "Testing period must start after the training period ends.";
                return BadRequest(response);
            }
            if (simulationStartDate <= testingEndDate)
            {
                response.Message = "Simulation period must start after the testing period ends.";
                return BadRequest(response);
            }
            if (trainingStartDate < datasetStartDate || simulationEndDate > datasetEndDate)
            {
                response.Message = $"All dates must be within the dataset's range ({datasetStartDate:yyyy-MM-dd} to {datasetEndDate:yyyy-MM-dd}).";
                return BadRequest(response);
            }

            response.Status = "Valid";
            response.Message = "Date ranges validated successfully!";
            
            response.TrainingDurationDays = (trainingEndDate - trainingStartDate).Days + 1;
            response.TestingDurationDays = (testingEndDate - testingStartDate).Days + 1;
            response.SimulationDurationDays = (simulationEndDate - simulationStartDate).Days + 1;

            Func<DateTime, bool> inTraining = ts => ts.Date >= trainingStartDate && ts.Date <= trainingEndDate;
            Func<DateTime, bool> inTesting = ts => ts.Date >= testingStartDate && ts.Date <= testingEndDate;
            Func<DateTime, bool> inSimulation = ts => ts.Date >= simulationStartDate && ts.Date <= simulationEndDate;

            response.TrainingRecordCount = records.Count(r => inTraining((DateTime)r["synthetic_timestamp"]));
            response.TestingRecordCount = records.Count(r => inTesting((DateTime)r["synthetic_timestamp"]));
            response.SimulationRecordCount = records.Count(r => inSimulation((DateTime)r["synthetic_timestamp"]));

            var monthlyCounts = records.GroupBy(r => ((DateTime)r["synthetic_timestamp"]).ToString("yyyy-MM")).ToDictionary(g => g.Key, g => g.Count());
            response.MonthlyRecordCounts = monthlyCounts;

            return Ok(response);
        }

        [HttpPost("train-model")]
        public async Task<IActionResult> TrainModel([FromBody] DateRangeRequest request)
        {
            if (_datasetService.Records == null || _datasetService.Records.Count == 0)
            {
                return BadRequest(new { message = "No dataset is loaded in memory. Please upload a file first." });
            }
            if (!request.TrainingStart.HasValue || !request.TrainingEnd.HasValue || !request.TestingStart.HasValue || !request.TestingEnd.HasValue)
            {
                return BadRequest(new { message = "Valid training and testing date ranges are required." });
            }

            try
            {
                var trainingStartDate = request.TrainingStart.Value.Date;
                var trainingEndDate = request.TrainingEnd.Value.Date;
                var testingStartDate = request.TestingStart.Value.Date;
                var testingEndDate = request.TestingEnd.Value.Date;
        
                var trainingData = _datasetService.Records
                    .Where(r => ((DateTime)r["synthetic_timestamp"]).Date >= trainingStartDate && ((DateTime)r["synthetic_timestamp"]).Date <= trainingEndDate)
                    .ToList();
                var testingData = _datasetService.Records
                    .Where(r => ((DateTime)r["synthetic_timestamp"]).Date >= testingStartDate && ((DateTime)r["synthetic_timestamp"]).Date <= testingEndDate)
                    .ToList();

                if (trainingData.Count == 0 || testingData.Count == 0)
                {
                    return BadRequest(new { message = "The selected date ranges resulted in zero records for training or testing." });
                }

                using var client = new HttpClient();
                var mlServiceUrl = "http://ml-service:8000/train";
                
                var mlRequestPayload = new { trainingData, testingData };
                var jsonPayload = JsonConvert.SerializeObject(mlRequestPayload);
                var content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                var response = await client.PostAsync(mlServiceUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new { message = $"Error from ML Service: {errorContent}" });
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var mlResponse = JsonConvert.DeserializeObject<TrainingResponse>(responseBody);
                
                return Ok(mlResponse);
            }
            catch (HttpRequestException e)
            {
                return StatusCode(503, new { message = $"Could not connect to the ML Service. Is Docker Compose running? Details: {e.Message}" });
            }
            catch (Exception e)
            {
                return StatusCode(500, new { message = $"An unexpected error occurred: {e.Message}" });
            }
        }
    }
}