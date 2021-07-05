const express = require('express');
const { env } = require('process');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const { parse } = require('dotenv');

require('dotenv').config();

const app = express();

//Use public folder for images
app.use(express.static('public'));

// Enable usses of JSON format
app.use(express.json());

// // Aldo accept raw text
// app.use(express.raw());

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connection = mysql.createConnection({
	host: env.host,
	user: env.user,
	password: env.password,
	database: env.database,
});

connection.connect((err) => {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}

	console.log('Successfully connected to database');
});

// Welcome screen
app.get('/', (req, res) => {
	res
		.status(200)
		.send(
			'<h1>Bienvenus sur notre application mobile de gestion de consultations médicales</h1>' +
				'<h4>Binôme: </h4>' +
				'<p>- HENDEL Samy</p>' +
				'<p>- NAIT MOULOUD Sifax</p>'
		);
});

// Get all doctors
app.get('/getDoctors', (req, res) => {
	var query = 'SELECT * from medecin';
	connection.query(query, (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send(results);
			} else {
				res.status(404).send({
					message: 'There is no doctor in database',
				});
			}
		}
	});
});

// Get traitements
app.get('/getTraitements/:idPatient', (req, res) => {
	var query = 'SELECT * from traitement where id_patient = ?';
	connection.query(query, [req.params.idPatient], (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send(results);
			} else {
				res.status(404).send({
					message: 'There is no traitement in database for this patient',
				});
			}
		}
	});
});

// Get medecin by speciality
// Get all doctors
app.get('/getMedecinBySpeciality/:speciality', (req, res) => {
	var query = 'SELECT * from medecin where specialite_medecin=?';
	connection.query(query, [req.params.speciality], (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send(results);
			} else {
				res.status(404).send({
					message: 'There is no doctor in database',
				});
			}
		}
	});
});

// Get medecin agenda
app.get('/getMedecinAgenda/:idMedecin', (req, res) => {
	var query = 'SELECT * from agenda where id_medecin=?';
	connection.query(query, [req.params.idMedecin], (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send(results);
			} else {
				res.status(404).send({
					message: 'There is no doctor in database',
				});
			}
		}
	});
});

// Check if doctor is working on the rendez-vous date
app.get('/isWorking/:id_medecin/:jour_rdv/:heure_rdv', (req, res) => {
	var query =
		'SELECT * from agenda where id_medecin = ? and jour_travail = ? and heure_travail_debut <= ? and heure_travail_fin >= ?';
	connection.query(
		query,
		[
			req.params.id_medecin,
			req.params.jour_rdv,
			parseInt(req.params.heure_rdv),
			(parseInt(req.params.heure_rdv) + 1).toString(),
		],

		(error, results) => {
			if (error) {
				res.status(500).send({
					error,
				});
			} else {
				if (results.length != 0) {
					res.status(200).send(true);
				} else {
					res.status(200).send(false);
				}
			}
		}
	);
});

// Check if doctor has RDV at a given date or not
app.get(
	'/hasRDV/:id_medecin/:jour_rdv/:mois_rdv/:annee_rdv/:heure_rdv',
	(req, res) => {
		var query =
			'SELECT * from rendez_vous where id_doctor = ? and jour_rdv = ? and mois_rdv = ? and annee_rdv = ? and heure_rdv = ?';
		connection.query(
			query,
			[
				req.params.id_medecin,
				req.params.jour_rdv,
				req.params.mois_rdv,
				req.params.annee_rdv,
				parseInt(req.params.heure_rdv),
			],

			(error, results) => {
				if (error) {
					res.status(500).send({
						error,
					});
				} else {
					if (results.length != 0) {
						res.status(200).send(true);
					} else {
						res.status(200).send(false);
					}
				}
			}
		);
	}
);

// add rendez_vous
app.post('/addRDV', function (req, res) {
	const query =
		'INSERT INTO rendez_vous (jour_rdv, mois_rdv, annee_rdv, heure_rdv, id_patient, id_doctor) VALUES (?, ?, ?, ?, ?, ?)';

	connection.query(
		query,
		[
			req.body.jour_rdv,
			req.body.mois_rdv,
			req.body.annee_rdv,
			req.body.heure_rdv,
			req.body.id_patient,
			req.body.id_doctor,
		],
		(error, results) => {
			if (results) {
				res.status(200).send('Rendez vous added successfully');
			} else {
				res.status(500).send({
					error,
				});
			}
		}
	);
});

// get RDV
app.get(
	'/getRDV/:jour_rdv/:mois_rdv/:annee_rdv/:heure_rdv/:id_medecin/:id_patient',
	function (req, res) {
		const query =
			'SELECT id_rdv FROM rendez_vous WHERE jour_rdv=? and mois_rdv=? and annee_rdv=? and heure_rdv=? and id_patient=? and id_doctor=?';

		connection.query(
			query,
			[
				req.params.jour_rdv,
				req.params.mois_rdv,
				req.params.annee_rdv,
				req.params.heure_rdv,
				req.params.id_patient,
				req.params.id_medecin,
			],
			(error, results) => {
				if (results) {
					res
						.status(200)
						.send(JSON.parse(JSON.stringify(results))[0].id_rdv.toString());
				} else {
					res.status(500).send({
						error,
					});
				}
			}
		);
	}
);

app.get('/getQRCode/:id_rdv', function (req, res) {
	const query = 'SELECT * FROM qr_codes WHERE id_rdv=?';

	connection.query(query, [req.params.id_rdv], (error, results) => {
		if (results) {
			res.status(200).send(results[0]);
		} else {
			res.status(500).send({
				error,
			});
		}
	});
});

// Add Qr Code
app.post('/addQrCode', function (req, res) {
	const query = 'INSERT INTO qr_codes (id_rdv, qr_code) VALUES (?, ?)';

	connection.query(
		query,
		[req.body.id_rdv, req.body.qr_code],
		(error, results) => {
			if (results) {
				res.status(200).send('QR Code added successfully');
			} else {
				res.status(500).send(error);
			}
		}
	);
});

// Add a doctor
app.post('/addDoctor', function (req, res) {
	const query =
		'INSERT INTO medecin (nom_medecin,prenom_medecin,num_tel_medecin,password_medecin) VALUES (?,?,?,?)';

	try {
		bcrypt.hash(req.body.password_medecin, 5, (err, encryptedPassword) => {
			connection.query(
				query,
				[
					req.body.nom_medecin,
					req.body.prenom_medecin,
					req.body.num_tel_medecin,
					encryptedPassword,
				],
				(error, results) => {
					if (results) {
						res.status(200).send({
							message: 'Medecin added successfully',
						});
					} else {
						res.status(500).send({
							error,
						});
					}
				}
			);
		});
	} catch (err) {
		res.status(500).send({
			error: err,
		});
	}
});

// Get all doctors
app.get('/getPatients', (req, res) => {
	var query = 'SELECT * from patient';
	connection.query(query, (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send({
					results,
				});
			} else {
				res.status(404).send({
					message: 'There is no patient in database',
				});
			}
		}
	});
});

// Get all rendez vous
app.get('/getRDVs', (req, res) => {
	var query = 'SELECT * from rendez_vous';
	connection.query(query, (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send(results);
			} else {
				res.status(404).send({
					message: 'There is no rendez vous in database',
				});
			}
		}
	});
});

// get full details of RDV
app.get('/getFullDetails', (req, res) => {
	var query =
		'SELECT r.*, m.*, q.*, p.* from rendez_vous r JOIN medecin m ON r.id_doctor=m.id_medecin JOIN qr_codes q ON q.id_rdv=r.id_rdv JOIN patient p ON p.id_patient=r.id_patient';
	connection.query(query, (error, results) => {
		if (error) {
			res.status(500).send({
				error,
			});
		} else {
			if (results.length != 0) {
				res.status(200).send(results);
			} else {
				res.status(404).send({
					message: 'There is no rendez vous in database (no details)',
				});
			}
		}
	});
});

// Verify authentification of a doctor
app.get(
	'/getDoctor/:num_tel_medecin/:password_medecin',
	function (req, res, next) {
		var data = Object();
		var pwd = req.params.password_medecin;
		var query = 'select * from medecin where num_tel_medecin=?';
		connection.query(
			query,
			[req.params.num_tel_medecin],
			function (error, results) {
				if (error) {
					next(error);
				} else {
					if (results.length > 0) {
						data = results[0];
						bcrypt.compare(pwd, data.password_medecin, function (err, result) {
							res.status(200).send(result);
						});
					} else {
						res.status(404).send({
							message: 'Not allowed',
						});
					}
				}
			}
		);
	}
);

// Verify authentification of a patient
app.get(
	'/getPatient/:num_tel_patient/:password_patient',
	function (req, res, next) {
		var data = Object();
		var pwd = req.params.password_patient;
		var query = 'select * from patient where num_tel_patient=?';
		connection.query(
			query,
			[req.params.num_tel_patient],
			function (error, results) {
				if (error) {
					next(error);
				} else {
					if (results.length > 0) {
						data = results[0];
						bcrypt.compare(pwd, data.password_patient, function (err, result) {
							res.status(200).send(result);
						});
					} else {
						res.status(404).send({
							message: 'Not allowed',
						});
					}
				}
			}
		);
	}
);

app.get('/getIdPatient/:num_tel_patient', function (req, res, next) {
	var data = Object();
	var query = 'select id_patient from patient where num_tel_patient=?';
	connection.query(
		query,
		[req.params.num_tel_patient],
		function (error, results) {
			if (error) {
				next(error);
			} else {
				if (results.length > 0) {
					data = results[0];
					const id = data.id_patient;
					res.status(200).send(String(id));
				} else {
					res.status(404).send({
						message: 'Not allowed',
					});
				}
			}
		}
	);
});

app.get('/getIdMedecin/:num_tel_medecin', function (req, res, next) {
	var data = Object();
	var query = 'select id_medecin from medecin where num_tel_medecin=?';
	connection.query(
		query,
		[req.params.num_tel_medecin],
		function (error, results) {
			if (error) {
				next(error);
			} else {
				if (results.length > 0) {
					data = results[0];
					const id = data.id_medecin;
					res.status(200).send(String(id));
				} else {
					res.status(404).send({
						message: 'Not allowed',
					});
				}
			}
		}
	);
});

// Add a patient
app.post('/addPatient', function (req, res) {
	const query =
		'INSERT INTO patient (nom_patient,prenom_patient,num_tel_patient,password_patient) VALUES (?,?,?,?)';

	try {
		bcrypt.hash(req.body.password_patient, 5, (err, encryptedPassword) => {
			connection.query(
				query,
				[
					req.body.nom_patient,
					req.body.prenom_patient,
					req.body.num_tel_patient,
					encryptedPassword,
				],
				(error, results) => {
					if (results) {
						res.status(200).send({
							message: 'Patient added successfully',
						});
					} else {
						res.status(500).send({
							error,
						});
					}
				}
			);
		});
	} catch (err) {
		res.status(500).send({
			error: err,
		});
	}
});

app.post('/addConseil', function (req, res, next) {
	var query =
		'INSERT  INTO conseil (text_conseil,id_medecin,id_patient) VALUES (?,?,?)';
	//console.log(req.body)
	connection.query(
		query,
		[req.body.conseil, req.body.id_medecin, 1],
		function (error, results) {
			if (error) {
				next(error);
			} else {
				res.send(JSON.stringify('success'));
			}
		}
	);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`server is up and running on port: http://localhost:${PORT}`);
});
