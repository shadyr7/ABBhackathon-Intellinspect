namespace Intellinspect.Backend.Models
{
    public class DateRangeRequest
    {
        public DateTime? TrainingStart { get; set; } // Nullable
        public DateTime? TrainingEnd { get; set; }   // Nullable
        public DateTime? TestingStart { get; set; }  // Nullable
        public DateTime? TestingEnd { get; set; }    // Nullable
        public DateTime? SimulationStart { get; set; } // Nullable
        public DateTime? SimulationEnd { get; set; }   // Nullable
    }
}