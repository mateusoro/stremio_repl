const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
var magnet = require("magnet-uri");
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://root:root@cluster0-0rj95.mongodb.net/test?retryWrites=true";
const client = new MongoClient(uri, { useNewUrlParser: true });

const builder = new addonBuilder({
	id: 'stremiodublado',
	version: '1.0.0',
	name: 'Dublado',
	catalogs: [],
	resources: ['stream'],
	types: ['movie', 'series'],
	idPrefixes: ['tt']
});
builder.defineStreamHandler(async function(args) {

	var key = args.id.replace(':', ' ').replace(':', ' ');
	var dataset_temp = [];
	console.log("SELECT * FROM registros where imdb='" + key + "'")
	var reg = await getRegistros(key);
	reg.forEach((row) => {
		try {
			var converte = fromMagnetMap(row.magnet, row.mapa, row.nome);
			//console.log(converte);
			if (dataset_temp != null) {
				if (dataset_temp.indexOf(converte) > -1) {
					console.log("Existe:", row.nome);
				} else {
					//console.log("PUSH:", converte);
					dataset_temp.push(converte);
				}
			} else {
				dataset_temp = [converte];
			}
		} catch (e) {
			console.log(e);
		}
	});
	console.log(dataset_temp.length);
	return Promise.resolve({ streams: dataset_temp });
});

client.connect(err => {	
	console.log('conectou');
});
async function getRegistros(key) {
	return client.db("registros").collection("registros").find({ imdb: key }).toArray();
}
function fromMagnetMap(uri, m, nome) {
	//console.log(uri);
	var parsed = magnet.decode(uri);
	// console.log(uri);
	var infoHash = parsed.infoHash.toLowerCase();
	nome = nome.toUpperCase();

	var tags = "";
	if (nome.match(/720P/i))
		tags = tags + ("720p ");
	if (nome.match(/1080P/i))
		tags = tags + ("1080p ");
	if (nome.match(/LEGENDADO/i))
		tags = tags + ("LEGENDADO ");
	if (nome.match(/DUBLADO/i))
		tags = tags + ("DUBLADO ");
	if (nome.match(/DUBLADA/i))
		tags = tags + ("DUBLADA ");
	if (nome.match(/DUAL/i))
		tags = tags + ("DUAL ÁUDIO ");
	if (nome.match(/4K/i))
		tags = tags + ("4K ");
	if (nome.match(/2160P/i))
		tags = tags + ("2160p ");
	if (nome.match(/UHD/i))
		tags = tags + ("UHD ");

	return {
		infoHash: infoHash,
		title: tags,
		fileIdx: m
	}
}
var addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 3000 });

