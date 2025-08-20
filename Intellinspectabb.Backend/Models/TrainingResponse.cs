namespace Intellinspect.Backend.Models
{
    public class TrainingResponse
    {
        public double Accuracy { get; set; }
        public double Precision { get; set; }
        public double Recall { get; set; }
        public double F1Score { get; set; }
        public string TrainingChartData { get; set; } = string.Empty;
        public string ConfusionMatrixData { get; set; } = string.Empty;
    }
}