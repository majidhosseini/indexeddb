﻿
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
    var reqfileObjectStore = db.createObjectStore("reqfile", { keyPath: "Id",
      autoIncrement: true });
}

function read(id) {
    var transaction = db.transaction(["session"]);
    var objectStore = transaction.objectStore("session");
    var sessionRequest = objectStore.get(id);

    sessionRequest.onerror = function (event) {
        alert("Unable to retrieve daفa from database!");
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
                    getData(data);
                },
                error: function (xhr, textStatus, errorThrown) {
                    // TODO: !?
                    console.log('Error in Database');
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
        console.log("جلسه به دیتابیس محلی اضافه شد");

        for (var i in sessionData.RequestResults) {
            var request = sessionData.RequestResults[i]
            var req = db.transaction(["request"], "readwrite")
                 .objectStore("request")
                 .add(request);

            req.onsuccess = function (event) {
                console.log("درخواست به دیتابیس محلی اضافه شد");
            }

            req.onerror = function (event) {
                alert("Unable to add request, is aready exist in your database! ");
            }

            var reqFile = {
                Id: request.Id,
                File: ''
            }

            var requestForFile = db.transaction(["reqfile"], "readwrite")
                 .objectStore("reqfile")
                 .add(reqFile);

            requestForFile.onsuccess = function (event) {
                console.log("reqfile added.");
            }

            requestForFile.onerror = function (event) {
                alert("Unable to add reqfile, is aready exist in your database! ");
            }
        }
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
    }

    request.onerror = function (event) {
        alert("Unable to update request from database!");
    };
}


//********************************** FILE ****************//
function requestFileRead(id) {
    var transaction = db.transaction(["reqfile"]);
    var objectStore = transaction.objectStore("reqfile");
    var requestFile = objectStore.get(id);

    requestFile.onsuccess = function (event) {
        // Get window.URL object
        var URL = window.URL || window.webkitURL;

        //var code = document.getElementById('reqFileUploadLink').textContent;
        //var blob = new Blob($('[name="reqFileUpload"]').val(), { type: 'text/plain' });
        //var url = URL.createObjectURL(blob);
        //var worker = new Worker(url);
        //URL.revokeObjectURL(url);

        //worker.onmessage = function (e) {
        //    console.log('worker returned: ', e.data);
        //};



        //// Create and revoke ObjectURL
        //var imgURL = URL.createObjectURL(requestFile.result.File);

        //// Set img src to ObjectURL
        //var imgElephant = document.getElementById("reqFileUploadLink");
        //imgElephant.setAttribute("href", imgURL);

        //// Revoking ObjectURL
        //URL.revokeObjectURL(imgURL);
    }

    requestFile.onerror = function (event) {
        alert("Unable to retrieve reqfile from database!");
    };
}


function requestFilePut(data) {
    var transaction = db.transaction(["reqfile"], "readwrite");
    var objectStore = transaction.objectStore("reqfile");
    var requestFile = objectStore.put(data)

    worker.onmessage = function (e) {
        console.log('worker returned: ', e.data);
    };

    requestFile.onsuccess = function (event) {
        console.log("successfuly reqfile updated.")
    }

    requestFile.onerror = function (event) {
        alert("Unable to update reqfile from database!");
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

//-------------------
function handleFileSelection(evt) {
  console.log("handleFileSelection()");

  var files = evt.target.files; // The files selected by the user (as a FileList object).
  if (!files) {
    displayMessage("<p>At least one selected file is invalid - do not select any folders.</p><p>Please reselect and try again.</p>");
    return;
  }

  var db = dbGlobals.db;
  if (!db) {
    console.log("db (i.e., dbGlobals.db) is null in handleFileSelection()");
    return;
  } // if

  try {
    var transaction = db.transaction(dbGlobals.storeName, (IDBTransaction.READ_WRITE ? IDBTransaction.READ_WRITE : 'readwrite')); // This is either successful or it throws an exception. Note that the ternary operator is for browsers that only support the READ_WRITE value.
  } // try
  catch (ex) {
    console.log("db.transaction exception in handleFileSelection() - " + ex.message);
    return;
  } // catch

  transaction.onerror = function(evt) {
    console.log("transaction.onerror fired in handleFileSelection() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode));
  }
  transaction.onabort = function() {
    console.log("transaction.onabort fired in handleFileSelection()");
  }
  transaction.oncomplete = function() {
    console.log("transaction.oncomplete fired in handleFileSelection()");
  }

  try {
    var objectStore = transaction.objectStore(dbGlobals.storeName); // Note that multiple put()'s can occur per transaction.

    for (var i = 0, file; file = files[i]; i++) {

	

      var putRequest = objectStore.put(file); // The put() method will update an existing record, whereas the add() method won't.
      putRequest.onsuccess = function() {
        dbGlobals.empty = false;
      } // There's at least one object in the database's object store. This info (i.e., dbGlobals.empty) is used in displayDB().
      putRequest.onerror = function(evt) {
        console.log("putRequest.onerror fired in handleFileSelection() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode));
      }
    } // for            
  } // try
  catch (ex) {
    console.log("Transaction and/or put() exception in handleFileSelection() - " + ex.message);
    return;
  } // catch

  document.getElementById('fileSelector').style.display = "none"; // An attempt has already been made to select file(s) so hide the "file picker" dialog box.
} // handleFileSelection
