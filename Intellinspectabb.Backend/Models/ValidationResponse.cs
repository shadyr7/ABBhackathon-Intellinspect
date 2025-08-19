namespace Intellinspect.Backend.Models
{
    public class ValidationResponse
    {
        public string Status { get; set; } = "Invalid";
        public string? Message { get; set; }
        public int TrainingDurationDays { get; set; }
        public int TestingDurationDays { get; set; }
        public int SimulationDurationDays { get; set; }
        public Dictionary<string, int> MonthlyRecordCounts { get; set; } = new();
    }
}