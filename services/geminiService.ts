import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Customer, GeneratedMessage, GenerationContext } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Schema for extracting customer data from the image
const customerListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      company: { type: Type.STRING, description: "Company name (Firma)" },
      representative: { type: Type.STRING, description: "Representative name (Temsilci)" },
      phone: { type: Type.STRING, description: "Phone number (Tel)" },
      country: { type: Type.STRING, description: "Address/Country (Adres)" },
      email: { type: Type.STRING, description: "Email address (Mail)" },
      website: { type: Type.STRING, description: "Website URL" },
      notes: { type: Type.STRING, description: "Description/Comments (Açıklama). Translate to English if in Turkish." },
    },
    required: ["company", "notes"], // Minimal requirement
  },
};

export const extractDataFromImage = async (base64Image: string): Promise<Customer[]> => {
  try {
    // Remove header if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG/JPEG, API handles standard types
              data: cleanBase64,
            },
          },
          {
            text: "Extract the customer data from this table image into a JSON structure. The columns map as follows: Firma->company, Temsilci->representative, Tel->phone, Adres->country, Mail->email, Web site->website, Açıklama->notes. Treat 'Açıklama' as highly important context. If a field is empty, use an empty string.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: customerListSchema,
        systemInstruction: "You are a precise data extraction assistant. You extract tabular data from images perfectly.",
      },
    });

    if (response.text) {
      const parsedData = JSON.parse(response.text);
      // Map and ensure defaults to prevent undefined errors
      return parsedData.map((c: any, index: number) => ({
        company: c.company || "",
        representative: c.representative || "",
        phone: c.phone || "",
        country: c.country || "",
        email: c.email || "",
        website: c.website || "",
        notes: c.notes || "",
        id: `cust-img-${Date.now()}-${index}`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error("Failed to extract data from image.");
  }
};

export const extractDataFromText = async (textData: string): Promise<Customer[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `Parse this raw text (likely copied from Excel) into a JSON structure. 
            The columns typically correspond to: Company (Firma), Representative (Temsilci), Phone (Tel), Country (Adres), Email (Mail), Website, Notes (Açıklama).
            
            Raw Text Data:
            ${textData}
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: customerListSchema,
        systemInstruction: "You are a data parsing assistant. You convert raw spreadsheet text (tab-separated or unstructured) into structured JSON. You handle Turkish headers and values intelligently.",
      },
    });

    if (response.text) {
      const parsedData = JSON.parse(response.text);
      // Map and ensure defaults to prevent undefined errors
      return parsedData.map((c: any, index: number) => ({
        company: c.company || "",
        representative: c.representative || "",
        phone: c.phone || "",
        country: c.country || "",
        email: c.email || "",
        website: c.website || "",
        notes: c.notes || "",
        id: `cust-txt-${Date.now()}-${index}`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error("Failed to parse text data.");
  }
};

export const generateDraft = async (
  customer: Customer, 
  context: GenerationContext,
  language: 'en' | 'ar' = 'en'
): Promise<GeneratedMessage> => {
  try {
    const isArabic = language === 'ar';
    const { senderCompany, exhibitionName, exhibitionLocation } = context;
    
    // Instructions for WhatsApp style
    const whatsappInstructions = isArabic 
      ? `
        Create a WhatsApp sequence in Arabic.
        Tone: Friendly, Respectful, Egyptian/White Arabic Business Style.
        
        Salutation Logic (Crucial):
        - Analyze "Recipient Name" and "Recipient Email".
        - If "Recipient Name" is missing or generic, try to extract the First Name from "Recipient Email" (e.g. ahmad.ghazzoul@... -> Name is Ahmed).
        - Use respectful titles: "أستاذ [First Name]" (Mr.) or "باشمهندس [First Name]" (if company/notes imply engineering/construction).
        - ALWAYS use "حضرتك" (Hadretak) instead of "انت" (Enta) to show respect.
        - If the name is completely unknown, use "يا فندم".

        Format: 4-5 short, distinct lines suitable for chat.
        START STRICTLY WITH: "السلام عليكم" or "السلام عليكم ورحمة الله وبركاته".
        
        Follow this flow:
        1. Greeting (Salam).
        2. Respectful check-in (e.g., "أخبار حضرتك إيه يا أستاذ [Name]" / "يا رب حضرتك تكون بخير").
        3. Identity (e.g., "مع حضرتك أحمد شرف من شركة ${senderCompany}").
        4. Context (e.g., "حضرتك شرفتنا في معرض ${exhibitionName}").
        5. Specific Need (Directly reference the notes, e.g., "بخصوص اهتمام حضرتك بـ [Product]" / "بخصوص استفسار حضرتك عن [Product]").
        
        Do not be overly formal like a government letter, but be respectful like a high-end sales professional.
      `
      : `
        Create a WhatsApp sequence in English.
        It must be CASUAL, DIRECT, and consist of 4-5 short, separate lines. 
        NO "Dear...", NO "Sincerely". 
        
        Name Logic:
        - If "Recipient Name" is missing, try to extract the First Name from "Recipient Email".
        
        Example flow:
        Line 1: Hello [Name]
        Line 2: How is everything going?
        Line 3: This is Ahmed Seref from ${senderCompany}
        Line 4: We met at the ${exhibitionName}
        Line 5: [Refer to specific notes: e.g., You asked for the MDF kit prices]
      `;

    const emailInstructions = isArabic
      ? `Write a professional business email in Arabic.
         Addressing: Start with "السيد الأستاذ/ [Name]" or "المهندس/ [Name]" (Infer name from email if Rep Name is missing).
         Subject Line: Create a specific subject line referencing the product/interest from the notes (e.g. "بخصوص استفساركم عن [Product Name] - ${exhibitionName}").
         Context: Mention we met at ${exhibitionName} in ${exhibitionLocation}.`
      : `Write a professional business email in English.
         Subject Line: Create a high-converting, attention-grabbing subject line that explicitly references the specific product or interest mentioned in the notes (e.g. "Pricing for [Product Name] - ${exhibitionName}", "Your interest in [Product] at ${senderCompany} stand"). Avoid generic subjects like "Hello" or "Follow up".
         Context: Mention we met at ${exhibitionName} in ${exhibitionLocation}.`;

    const prompt = `
      Sender: Ahmed Seref, Export Executive at ${senderCompany} (Akfix.com).
      Recipient Name: "${customer.representative || ''}".
      Recipient Email: "${customer.email || ''}".
      Company: "${customer.company}".
      Specific Notes from Fair: "${customer.notes}".
      Campaign Context: Exhibition "${exhibitionName}" in "${exhibitionLocation}".
      
      Task:
      1. ${emailInstructions}
      2. ${whatsappInstructions}
      
      Output JSON with 'emailSubject', 'emailBody', and 'whatsappBody'. 
      For 'whatsappBody', join the short lines with actual newlines characters (\\n) so they look like a chat history.
    `;

    const messageSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        emailSubject: { type: Type.STRING },
        emailBody: { type: Type.STRING },
        whatsappBody: { type: Type.STRING },
      },
      required: ["emailSubject", "emailBody", "whatsappBody"],
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: messageSchema,
        temperature: 0.7, 
      },
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        return {
            subject: data.emailSubject,
            body: data.emailBody,
            type: 'email',
            whatsappBody: data.whatsappBody // Helper to carry specific body if needed
        };
    }
    
    throw new Error("No response generated");

  } catch (error) {
    console.error("Generation error:", error);
    return {
      subject: "Follow up",
      body: "Error generating draft.",
      type: 'email'
    };
  }
};