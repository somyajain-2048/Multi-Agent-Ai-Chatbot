import PDFDocument from "pdfkit";

export const generatePdf = async (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
            info: {
                Author: "CortexAI",
                Title: data?.title || "Document",
                Creator: "CortexAI"
            }
        });

        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));

        // title
        doc.fontSize(28)
            .fillColor("#111827")
            .text(data?.title || "Untitled Document", {
                align: "center"
            });

        if (data?.subtitle) {
            doc.moveDown(0.5);
            doc.fontSize(12)
                .fillColor("#6B7280")
                .text(data.subtitle, {
                    align: "center"
                });
        }

        // sections
        doc.moveDown(2);

        data?.sections?.forEach(s => {
            if (s.heading) {
                doc.fontSize(18)
                    .fillColor("#111827")
                    .text(s.heading);
                doc.moveDown(0.5);
            }

            s?.points?.forEach((p) => {
                doc.fontSize(12)
                    .fillColor("#374151")
                    .text("• " + p, {
                        lineGap: 5
                    });
            });

            doc.moveDown();
        });

        doc.end();
    });
};