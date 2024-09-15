const fs = require('fs');
const {
	PDFDocument,
	PDFName,
	PDFDict,
	PDFArray,
	PDFStream,
	decodePDFRawStream,
} = require('pdf-lib');

const extractRawAttachments = (pdfDoc) => {
	if (!pdfDoc.catalog.has(PDFName.of('Names'))) return [];
	const Names = pdfDoc.catalog.lookup(PDFName.of('Names'), PDFDict);

	if (!Names.has(PDFName.of('EmbeddedFiles'))) return [];
	const EmbeddedFiles = Names.lookup(PDFName.of('EmbeddedFiles'), PDFDict);

	if (!EmbeddedFiles.has(PDFName.of('Names'))) return [];
	const EFNames = EmbeddedFiles.lookup(PDFName.of('Names'), PDFArray);

	const rawAttachments = [];
	for (let idx = 0, len = EFNames.size(); idx < len; idx += 2) {
		const fileName = EFNames.lookup(idx);
		const fileSpec = EFNames.lookup(idx + 1, PDFDict);
		rawAttachments.push({ fileName, fileSpec });
	}

	return rawAttachments;
};

const extractAttachments = (pdfDoc) => {
	const rawAttachments = extractRawAttachments(pdfDoc);
	return rawAttachments.map(({ fileName, fileSpec }) => {
		const stream = fileSpec
			.lookup(PDFName.of('EF'), PDFDict)
			.lookup(PDFName.of('F'), PDFStream);
		return {
			name: fileName.decodeText(),
			data: decodePDFRawStream(stream).decode(),
		};
	});
};

(async () => {
	const pdfBuffer = fs.readFileSync('./test.pdf');

	// const pdfWithAttachments = await fetch(
	// 	'https://github.com/Hopding/pdf-lib/files/4963252/with_attachment.pdf'
	// ).then((res) => res.arrayBuffer());

	const pdfDoc = await PDFDocument.load(pdfBuffer);

	const attachments = extractAttachments(pdfDoc);

	// const csv = attachments.find((attachment) => attachment.name === 'cars.csv');
	// fs.writeFileSync('cars.csv', csv.data);
	// console.log('CSV file written to ./cars.csv');

	// const jpg = attachments.find((attachment) => attachment.name === 'mini.jpg');
	// fs.writeFileSync('mini.jpg', jpg.data);
	// console.log('JPG file written to ./mini.jpg');
	// console.log(attachments);
	const xml = attachments.find((attachment) =>
		attachment.name.includes('.xml')
	);
	const buffer = Buffer.from(xml.data);
	fs.writeFileSync(xml.name, xml.data);
	console.log('CSV file written to some .xml');
})();
