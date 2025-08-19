namespace Intellinspect.Backend.Models
{
    public class ValidationResponse
    {
        public string Status { get; set; } = "Invalid";
        public string? Message { get; set; }
        public int TrainingDurationDays { get; set; }
        public int TestingDurationDays { get; set; }
        public int SimulationDurationDays { get; set; }
        
        // These are the new properties
        public int TrainingRecordCount { get; set; }
        public int TestingRecordCount { get; set; }
        public int SimulationRecordCount { get; set; }

        // This is the original property - NO DUPLICATE
        public Dictionary<string, int> MonthlyRecordCounts { get; set; } = new();
    }
}