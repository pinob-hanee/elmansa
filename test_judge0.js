const axios = require('axios');

async function test() {
  const payload = {
    source_code: `def sum_array(arr):
    total = 0
    for num in arr:
        total += num
    return total

n = int(input())
arr = list(map(int, input().split()))
print(sum_array(arr))`,
    language_id: 71,
    stdin: "",
    cpu_time_limit: 5,
    memory_limit: null
  };

  try {
    const res = await axios.post(
      "https://frostlike-wriggle-sleep.ngrok-free.dev//submissions?base64_encoded=false&wait=true",
      payload,
      { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } }
    );
    console.log("Success:", res.status, res.data);
  } catch (e) {
    console.error("Error:", e.response?.status, JSON.stringify(e.response?.data, null, 2));
  }
}
test();
