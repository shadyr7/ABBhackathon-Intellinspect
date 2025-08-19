namespace Intellinspect.Backend.Services
{
    public class DatasetService
    {
        // We will store the augmented dataset here
        // A List of Dictionaries is a flexible way to hold CSV data
        public List<Dictionary<string, object>> Records { get; private set; } = new();

        // We also store the headers for later use
        public List<string> Headers { get; private set; } = new();

        // A method to clear old data and store the new processed data
        public void StoreDataset(List<string> headers, List<Dictionary<string, object>> records)
        {
            Headers = headers ?? new List<string>();
            Records = records ?? new List<Dictionary<string, object>>();
            
            Console.WriteLine($"Dataset stored successfully. {Records.Count} records.");
        }
    }
}