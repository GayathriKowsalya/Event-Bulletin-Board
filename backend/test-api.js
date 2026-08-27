async function runTests() {
  console.log("Testing GET /api/events");
  const res1 = await fetch("http://localhost:3001/api/events");
  const data1 = await res1.json();
  console.log("Events count:", data1.events?.length);
  
  if (data1.events && data1.events.length > 0) {
    const eventId = data1.events[0].id;
    console.log("Testing GET /api/events/:id for id", eventId);
    const res2 = await fetch("http://localhost:3001/api/events/" + eventId);
    const data2 = await res2.json();
    console.log("Event title:", data2.event?.title);
  }

  console.log("Testing POST /api/events");
  const res3 = await fetch("http://localhost:3001/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Event API",
      description: "Testing API",
      category: "Community",
      event_date: new Date().toISOString(),
      location: "Virtual"
    })
  });
  const data3 = await res3.json();
  console.log("Created Event:", data3.event?.title);
  const newId = data3.event?.id;

  if (newId) {
    console.log("Testing PUT /api/events/:id");
    const res4 = await fetch("http://localhost:3001/api/events/" + newId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Test Event" })
    });
    const data4 = await res4.json();
    console.log("Updated title:", data4.event?.title);

    console.log("Testing DELETE /api/events/:id");
    const res5 = await fetch("http://localhost:3001/api/events/" + newId, { method: "DELETE" });
    console.log("Delete status:", res5.status);
  }

  console.log("Testing GET /api/events/search?q=Virtual");
  const res6 = await fetch("http://localhost:3001/api/events/search?q=Virtual");
  const data6 = await res6.json();
  console.log("Search count:", data6.events?.length);

  console.log("Testing GET /api/events?category=Sports");
  const res7 = await fetch("http://localhost:3001/api/events?category=Sports");
  const data7 = await res7.json();
  console.log("Category count:", data7.events?.length);
}

runTests().catch(console.error);
