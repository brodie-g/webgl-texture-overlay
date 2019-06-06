let defaultExport = {};
defaultExport.clone = obj => JSON.parse(JSON.stringify(obj));
export default defaultExport;
