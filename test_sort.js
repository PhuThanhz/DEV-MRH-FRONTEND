const nodes = [{folderName: "Năm 2024"}, {folderName: "Năm 2026"}, {folderName: "Năm 2025"}];
nodes.sort((a, b) => b.folderName.localeCompare(a.folderName));
console.log(nodes);
