import twilio from "twilio";

export async function callPatient() {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  await client.calls.create({
    to: "+962XXXXXXXXX", // حط رقمك
    from: process.env.TWILIO_PHONE_NUMBER!,
    url: "http://demo.twilio.com/docs/voice.xml",
  });

  console.log("Calling...");
}