import * as fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const createPDFBytesArray = async (pdfPaths: string[]) => {
  const readPromises: Promise<Buffer>[] = [];
  for (const pathToPDF of pdfPaths) {
    readPromises.push(
      new Promise((res, rej) => {
        fs.readFile(path.join(__dirname, pathToPDF), (err, data) => {
          if (err) {
            rej(err);
          } else {
            res(data);
          }
        });
      })
    );
  }
  const allBytes = await Promise.all(readPromises);
  return allBytes;
};

export const main = async () => {
  const newPDFDoc = await PDFDocument.create();
  const pdfFiles: string[] = [];

  const readFiles = new Promise<void>((res, rej) => {
    fs.readdir(path.join(__dirname, "assets"), (err, files) => {
      if (err) {
        rej(err);
      }
      for (const file of files) {
        if (!file.includes("/") && file.endsWith(".pdf")) {
          pdfFiles.push(`/assets/${file}`);
        }
      }
      res();
    });
  });

  await readFiles;

  const pdfBytes = await createPDFBytesArray(pdfFiles);

  for (const bytes of pdfBytes) {
    const pdfDocToInsert = await PDFDocument.load(bytes);
    const numPages = pdfDocToInsert.getPageCount();

    const pages = await newPDFDoc.copyPages(pdfDocToInsert, [
      ...Array(numPages).keys(),
    ]);

    pages.forEach((p) => {
      newPDFDoc.addPage(p);
    });
  }
  const combinedPDFBytes = await newPDFDoc.save();

  fs.writeFileSync(path.join(__dirname, "/out/combined.pdf"), combinedPDFBytes);
};

main();
