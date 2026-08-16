const { renderCompanyProfilePdf } = require("./apps/web/src/lib/documents/pdf");
const fs = require("fs");

async function run() {
  try {
    const pdf = await renderCompanyProfilePdf({
        projects: [{code: "P001", name: "Real Project A", projectType: "CONSTRUCTION", status: "COMPLETED", client: "Client X"}],
        equipment: [{assetCode: "E001", name: "Excavator", category: "HEAVY", status: "ACTIVE"}],
        includeStamp: true,
        includeSignature: true,
    });
    fs.writeFileSync("company-profile-test.pdf", pdf);
    console.log("PDF generated successfully");
  } catch (e) {
    console.error(e);
  }
}
run();
