
// init indexedDB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

var db;
var sessionRequest = window.indexedDB.open("IranDocDatabase", 1);

sessionRequest.onerror = function (event) {
    console.log("error: ");
};

sessionRequest.onsuccess = function (event) {
    db = sessionRequest.result;
    getFromDB();
};

sessionRequest.onupgradeneeded = function (event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore("session", { keyPath: "Id" });
    var requestObjectStore = db.createObjectStore("request", { keyPath: "Id" });
    var reqfileObjectStore = db.createObjectStore("reqfile", { keyPath: "Id", autoIncrement: true });
}

function read(id) {
    var transaction = db.transaction(["session"]);
    var objectStore = transaction.objectStore("session");
    var sessionRequest = objectStore.get(id);

    sessionRequest.onerror = function (event) {
        alert("Unable to retrieve data from database!");
    };

    sessionRequest.onsuccess = function (event) {
        if (sessionRequest.result) {
            getData(sessionRequest.result);
        } else {
            $.ajax({
                url: 'http://92.50.13.16:6073/api/sessions/' + id,
                type: 'GET',
                dataType: 'json',
                success: function (data, textStatus, xhr) {
                    add(data);
                },
                error: function (xhr, textStatus, errorThrown) {
                    $.amaran({'message':'در اتصال به داده‌های محلی مشکلی پیش آمده است'});
                }
            });
        }
    };
}

function readAll() {
    var objectStore = db.transaction("session").objectStore("session");
    return objectStore;
}

function add(sessionData) {

    var session = db.transaction(["session"], "readwrite")
        .objectStore("session")
        .add(sessionData);

    session.onsuccess = function (event) {
        $.amaran({'message':'جلسه به دیتابیس محلی اضافه شد'});

        for (var i in sessionData.RequestResults) {
            var request = sessionData.RequestResults[i];
            request.isSynced = false;

            var req = db.transaction(["request"], "readwrite")
                 .objectStore("request")
                 .add(request);

            req.onsuccess = function (event) {
                console.log('درخواست به دیتابیس محلی اضافه شد');
            }

            req.onerror = function (event) {
                alert("Unable to add request, is aready exist in your database! ");
            }
        }

        getData(sessionData);
        $.amaran({'message': sessionData.RequestResults.length + ' درخواست به دیتابیس محلی اضافه شد '});
    };

    session.onerror = function (event) {
        alert("Unable to add session, is aready exist in your database! ");
    }
}

function remove(id) {
    var request = db.transaction(["session"], "readwrite")
    .objectStore("session")
    .delete(id);

    request.onsuccess = function (event) {
        alert("session's entry has been removed from your database.");
    };
}

function readSessionForPost(id) {
    var transaction = db.transaction(["session"]);
    var objectStore = transaction.objectStore("session");
    var sessionRequest = objectStore.get(id);

    sessionRequest.onerror = function (event) {
        alert("Unable to retrieve sesison data from database that send to host!");
    };

    sessionRequest.onsuccess = function (event) {
        var session = sessionRequest.result;
        if (session) {
            sendSessionInfoWithRequestToServer(session);
        } else {
            console.log('session not found!')
        }
    };
}

//************************** REQUEST *******************************//
function requestRead(id) {
    var transaction = db.transaction(["request"]);
    var objectStore = transaction.objectStore("request");
    var request = objectStore.get(id);

    request.onsuccess = function (event) {
    	displayDB(id)
        setRequest(request.result)
    }

    request.onerror = function (event) {
        alert("Unable to retrieve request from database!");
    };
}

function requestPut(data) {
    var transaction = db.transaction(["request"], "readwrite");
    var objectStore = transaction.objectStore("request");
    var request = objectStore.put(data)

    request.onsuccess = function (event) {
        console.log("successfuly request updated.")
        doOrange();
    }

    request.onerror = function (event) {
        alert("Unable to update request from database!");
        doNotSaveDb();
    };
}

function sendSessionInfoWithRequestToServer(session) {
    var objectStore = db.transaction("request").objectStore("request");
    var i = 0;

    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;

        if (cursor) {
            session.RequestResults[i] = cursor.value;
            console.log(cursor.value);
            i = i + 1;
            cursor.continue();
        } else {
            sendSessionInfoToServer(session);
        }
    };
}

// Request file database handling
// PUT REQUEST FILE
function reqFilePut(file, requestId) {
  var transaction = db.transaction(["reqfile"], "readwrite");
  var objectStore = transaction.objectStore("reqfile");

	var data = {
    isSynced: false,
		requestId: requestId,
		file: file
	}

  var putRequest = objectStore.put(data);
  putRequest.onsuccess = function(event) {
     console.log("success file put in db")
     uploadFile(file, event.target.result, requestId)
  }

  putRequest.onerror = function(event) {
    console.log("putRequest.onerror fired in reqFileUpdate() - error code: " + (event.target.error ? event.target.error : event.target.errorCode));
  }
}

/// DISPLAY file
function displayDB(requestId) {
	try {
	    var transaction = db.transaction("reqfile", (IDBTransaction.READ_WRITE ? IDBTransaction.READ_WRITE : 'readwrite'));
      var objectStore = transaction.objectStore("reqfile");

    try {
      var cursorRequest = objectStore.openCursor();

      cursorRequest.onerror = function(evt) {
        console.log("cursorRequest.onerror fired in displayDB() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode));
      }

      var fileListHTML = "<p><strong>File(s) in database:</strong></p><ul style='margin: -0.5em 0 1em -1em;'>";

      cursorRequest.onsuccess = function(evt) {
        var cursor = evt.target.result;
        if (cursor) {
        	if (cursor.value.requestId !== undefined && Number(cursor.value.requestId) === requestId) {
					  var videoFile = event.target.result;
				    var URL = window.URL || window.webkitURL;
				    var fileURL = URL.createObjectURL(cursor.value.file);

		        fileListHTML += "<li>" + cursor.value.file.name;
		        fileListHTML += "<p style='margin: 0 0 0 0.75em;'>" + cursor.value.file.lastModifiedDate + "</p>";
		        fileListHTML += "<p style='margin: 0 0 0 0.75em;'>" + cursor.value.file.size + " bytes</p>";
						fileListHTML += "<a href='" + fileURL + "'>link</a>";

		        cursor.continue();
          } else {
          	cursor.continue();
          }
        } else {
          fileListHTML += "</ul>";
          displayMessage(fileListHTML);
        }
      }
    }
    catch (innerException) {
      console.log("Inner try exception in displayDB() - " + innerException.message);
    }
  }
  catch (outerException) {
    console.log("Outer try exception in displayDB() - " + outerException.message);
  }
}


// Update File
function doFileSynced(id) {
  var transaction = db.transaction(["reqfile"], (IDBTransaction.READ_WRITE ? IDBTransaction.READ_WRITE : 'readwrite'));
  var objectStore = transaction.objectStore("reqfile");
  var reqfile = objectStore.get(id);

  reqfile.onsuccess = function(event) {
    var data = event.target.result;
    data.isSynced = true;

    var reqFileUpdate = objectStore.put(data);
    reqFileUpdate.onerror = function(event) {
     // Do something with the error
    };
    reqFileUpdate.onsuccess = function(event) {
     // Success - the data is updated!
    };
  }

  reqfile.onerror = function (event) {
    // Do something with the error
  };
}
