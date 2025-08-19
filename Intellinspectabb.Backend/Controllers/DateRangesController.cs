using Microsoft.AspNetCore.Mvc;
using Intellinspect.Backend.Services;
using Intellinspect.Backend.Models;

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
            // --- NEW NULL CHECK ---
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

            // --- CORRECTED VALIDATION LOGIC (USING .Value) ---
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

            // --- If validation passes, calculate metrics (USING .Value) ---
            response.Status = "Valid";
            response.Message = "Date ranges validated successfully!";
            
            response.TrainingDurationDays = (trainingEndDate - trainingStartDate).Days + 1;
            response.TestingDurationDays = (testingEndDate - testingStartDate).Days + 1;
            response.SimulationDurationDays = (simulationEndDate - simulationStartDate).Days + 1;

            // --- CORRECTED RECORD COUNTING LOGIC ---
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
    }
}