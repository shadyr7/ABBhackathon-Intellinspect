using Microsoft.AspNetCore.Mvc;
using Intellinspect.Backend.Services;
using Intellinspect.Backend.Models;

namespace Intellinspect.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Routes to /api/DateRanges
    public class DateRangesController : ControllerBase
    {
        private readonly DatasetService _datasetService;

        public DateRangesController(DatasetService datasetService)
        {
            _datasetService = datasetService;
        }

        [HttpPost("validate")] // Full route: POST /api/DateRanges/validate
        public IActionResult ValidateRanges([FromBody] DateRangeRequest request)
        {
            var response = new ValidationResponse();
            var records = _datasetService.Records;

            if (records.Count == 0)
            {
                response.Message = "No dataset found. Please upload a file first.";
                return BadRequest(response);
            }

            // Get overall dataset boundaries
            var datasetStart = (DateTime)records.First()["synthetic_timestamp"];
            var datasetEnd = (DateTime)records.Last()["synthetic_timestamp"];

            // --- Perform Validation Logic ---
            if (request.TrainingStart > request.TrainingEnd || request.TestingStart > request.TestingEnd || request.SimulationStart > request.SimulationEnd)
            {
                response.Message = "Start date cannot be after the end date for any period.";
                return BadRequest(response);
            }
            if (request.TestingStart <= request.TrainingEnd)
            {
                response.Message = "Testing period must start after the training period ends.";
                return BadRequest(response);
            }
            if (request.SimulationStart <= request.TestingEnd)
            {
                response.Message = "Simulation period must start after the testing period ends.";
                return BadRequest(response);
            }
            if (request.TrainingStart < datasetStart || request.SimulationEnd > datasetEnd)
            {
                response.Message = $"All dates must be within the dataset's range ({datasetStart:yyyy-MM-dd} to {datasetEnd:yyyy-MM-dd}).";
                return BadRequest(response);
            }

            // --- If all validation passes, calculate metrics ---
            response.Status = "Valid";
            response.Message = "Date ranges validated successfully!";
            
            // Calculate durations
            response.TrainingDurationDays = (request.TrainingEnd - request.TrainingStart).Days + 1;
            response.TestingDurationDays = (request.TestingEnd - request.TestingStart).Days + 1;
            response.SimulationDurationDays = (request.SimulationEnd - request.SimulationStart).Days + 1;

            // Calculate monthly record counts for the bar chart
            var monthlyCounts = records
                .GroupBy(r => ((DateTime)r["synthetic_timestamp"]).ToString("yyyy-MM"))
                .ToDictionary(g => g.Key, g => g.Count());
            
            response.MonthlyRecordCounts = monthlyCounts;

            return Ok(response);
        }
    }
}