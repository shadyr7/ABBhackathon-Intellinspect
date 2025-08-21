using Microsoft.AspNetCore.Mvc;
using Intellinspect.Backend.Services;
using System;
using System.IO;
using System.Threading.Tasks;
using CsvHelper;
using System.Globalization;
using CsvHelper.Configuration;
using System.Linq;
using System.Collections.Generic;

namespace Intellinspect.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly DatasetService _datasetService;

        public UploadController(DatasetService datasetService)
        {
            _datasetService = datasetService;
        }

        [HttpPost]
        public IActionResult Upload(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { error = "No file uploaded." });
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)) return BadRequest(new { error = "Invalid file type." });

            try
            {
                var config = new CsvConfiguration(CultureInfo.InvariantCulture) { TrimOptions = TrimOptions.Trim };
                using var reader = new StreamReader(file.OpenReadStream());
                using var csv = new CsvReader(reader, config);

                csv.Read();
                csv.ReadHeader();
                var headers = csv.HeaderRecord.ToList();
                var responseKey = headers.FirstOrDefault(h => h.Equals("Response", StringComparison.OrdinalIgnoreCase));

                if (responseKey == null)
                    return BadRequest(new { error = "CSV must contain a 'Response' column." });

                var records = csv.GetRecords<dynamic>().ToList();
                if (records.Count == 0) return BadRequest(new { error = "CSV is empty." });

                var augmentedRecords = new List<Dictionary<string, object>>();
                var timestamp = new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);

                foreach (var record in records)
                {
                    var dict = (IDictionary<string, object>)record;
                    var newDict = new Dictionary<string, object>(dict, StringComparer.OrdinalIgnoreCase);
                    newDict["synthetic_timestamp"] = timestamp;
                    augmentedRecords.Add(newDict);
                    timestamp = timestamp.AddHours(1); // <-- THE CRITICAL FIX FOR DATE RANGE
                }

                var augmentedHeaders = new List<string>(headers) { "synthetic_timestamp" };
                _datasetService.StoreDataset(augmentedHeaders, augmentedRecords);
                
                var totalRecords = augmentedRecords.Count;
                var passCount = augmentedRecords.Count(r => r[responseKey]?.ToString() == "1");
                var passRate = totalRecords > 0 ? Math.Round((double)passCount / totalRecords, 4) : 0.0;
                
                var response = new 
                {
                    totalRecords,
                    totalColumns = augmentedHeaders.Count,
                    passRate,
                    earliestTimestamp = augmentedRecords.First()["synthetic_timestamp"],
                    latestTimestamp = augmentedRecords.Last()["synthetic_timestamp"],
                    monthlyRecordCounts = augmentedRecords.GroupBy(r => ((DateTime)r["synthetic_timestamp"]).ToString("yyyy-MM")).ToDictionary(g => g.Key, g => g.Count())
                };
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }
    }
}