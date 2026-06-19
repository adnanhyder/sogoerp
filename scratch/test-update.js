const { Client } = require('pg');

async function testUpdate() {
  // Try to update one of the devices directly with a fetch call
  const body = {
    id: "bf16f4cc-1d25-4a1e-bdab-0ba2f9a5f43b",
    moduleKey: "inventory",
    values: {
      custody_status: "on_the_way",
      courier_company: "TCS",
      consignment_number: "12345678901",
      technician_id: "48bbd0e0-b164-409d-ac63-df69d17c7dc2"
    }
  };

  try {
    const res = await fetch("http://localhost:3000/api/erp/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testUpdate();
