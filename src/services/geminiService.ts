import { GoogleGenAI } from "@google/genai";
import { Storage } from "./storage";

export const getBusinessInsights = async (): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return "API Key is missing. Please configure process.env.API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Gather data context (Async now)
    const customers = await Storage.getCustomers();
    const allDocs = await Storage.getDocuments();
    const invoices = allDocs.filter(d => d.type === 'invoice');
    const logs = (await Storage.getLogs()).slice(0, 50); // Last 50 logs
    
    const totalRevenue = invoices.reduce((sum, inv) => {
       const total = inv.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
       return sum + total;
    }, 0);

    const context = `
      Data Summary:
      Total Customers: ${customers.length}
      Total Invoices Issued: ${invoices.length}
      Total Revenue: ${totalRevenue}
      Recent Activity Log: ${JSON.stringify(logs.map(l => l.action + ': ' + l.details))}
    `;

    const prompt = `
      You are a business analyst for an Indian company using "Invoice Pro".
      Analyze the provided data summary. 
      1. Provide a brief health check of the business.
      2. Identify any patterns in the recent activity logs.
      3. Suggest one actionable tip to improve billing efficiency.
      Keep the response concise, professional, and friendly.
      
      Context:
      ${context}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights. Please check your connection or API key.";
  }
};