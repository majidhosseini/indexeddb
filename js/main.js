function getFromDB() {
    var id = 1220
    read(id)
}

function getData(data) {
  $('[name="title"]').html(data.Title);
  for (var i = 1; i <= data.RequestResults.length; i++) {
      $('div[class="btn-group"').append('<button type="button" class="btn btn-light" onclick="getRequest(' + data.RequestResults[i-1].Id + ');">' + i + '</button>')
  }

  requestRead(data.RequestResults[0].Id);
  endLoader();
}

function getRequest(id) {
  updateRequest();
  requestRead(id);
}

function setRequest(data) {
  $('[name="requestTitle"]').html(data.Title);
  $('[name="requestBody"]').html(data.RequestBody);
  $('[name="requestId"]').val(data.Id);
  $('[name="ChangedBody"]').html(data.TrusteeBody)
  $('[name="ChangeState"]').val(data.ChangeState)
  $('[id="fileSelector"]').val('');
  CKEDITOR.instances['ChangedBody'].setData(data.ChangedBody);
}

function updateRequest() {
  doSaveDb();
  if ($('[name="requestId"]').val() !== '') {
    var request = {
      Id: parseInt($('[name="requestId"]').val()),
      Title: $('[name="requestTitle"]').html(),
      ChangedBody: CKEDITOR.instances['ChangedBody'].getData(),
      RequestBody: $('[name="requestBody"]').html(),
      ChangeState: $('[name="ChangeState"]').val(),
      isSynced: false
    }
    requestPut(request);
    postRequest(request)
  }
}

function postRequest(request) {
  doPost();
  $.ajax({
    url: 'http://92.50.13.16:6073/api/sessions/' + 1220 + '/requests/',
    type: 'POST',
    dataType: 'json',
    data: request,
    success: function (result, textStatus, xhr) {
      doSynced();
      doRequestSynced(request.Id);
    },
    error: function (xhr, textStatus, errorThrown) {
      doOrange();
      console.log('Error in send info');
    }
  });
}

function postData() {
  $('[name="postData"]').addClass("hide");
  $('[name="resultMessage"]').addClass("hide");
  readSessionForPost(1220);
}

function sendSessionInfoToServer(session) {
  doPost();
  $.ajax({
      url: 'http://92.50.13.16:6073/api/sessions/',
      type: 'POST',
      dataType: 'json',
      data: session,
      success: function (data, textStatus, xhr) {
          $('[name="postData"]').removeClass("hide");
          $('[name="resultMessage"]').removeClass("hide");

          $('[name="resultMessage"]').html('اطلاعات به سرور ارسال شد!');
          $.amaran({'message':'اطلاعات به سرور ارسال شد!'});
          doSynced();
      },
      error: function (xhr, textStatus, errorThrown) {
        doOrange();
        console.log('Error in send info');
      }
  });
}

function downloadFile(requestId) {
  $.ajax({
      url: 'http://92.50.13.16:6073/api/sessions/1220/requests/' + requestId + '/files',
      processData: false,
      contentType: false,
      data: data,
      type: 'GET'
  }).done(function (result) {
    reqFilePut(result, requestId)
  }).fail(function (a, b, c) {
      console.log(a, b, c);
  });
}

function uploadFile(file, reqFileId, requestId) {
  doPost();

  var data = new FormData();
  data.append('file', file);
  $.ajax({
      url: 'http://92.50.13.16:6073/api/sessions/1220/requests/' + requestId + '/files',
      processData: false,
      contentType: false,
      data: data,
      type: 'POST'
  }).done(function (result) {
    console.log(result);
    doFileSynced(reqFileId)
    doSynced();
  }).fail(function (a, b, c) {
      console.log(a, b, c);
      doOrange();
  });
}

function handleFileSelection(evt) {
  var files = evt.target.files;
  if (!files) {
    displayMessage("<p>At least one selected file is invalid - do not select any folders.</p><p>Please reselect and try again.</p>");
    return;
  }

  var requestId = $('[name="requestId"]').val();
  for (var i = 0, file; file = files[i]; i++) {
    reqFilePut(file, requestId)
  }
}

document.getElementById('fileSelector').addEventListener('change', handleFileSelection, false);

function doLoader() {
  console.log('doLoader')

  $('[id="syncer"]').css('display', 'block');
  $('[id="synced"]').css('display', 'none');
  $('[id="ready"]').css('display', 'none');

  document.getElementById("synceMessage").innerHTML = "";
}

function doOrange() {
  console.log('doOrange')

  $('[id="syncer"]').css('display', 'none');
  $('[id="synced"]').css('display', 'none');
  $('[id="ready"]').css('display', 'block');

  document.getElementById("synceMessage").innerHTML = "";
}

function doSynced() {
  console.log('doSynced')

  $('[id="syncer"]').css('display', 'none');
  $('[id="synced"]').css('display', 'block');
  $('[id="ready"]').css('display', 'none');

  document.getElementById("synceMessage").innerHTML = "";
}

function doSaveDb() {

  document.getElementById("synceMessage").innerHTML = "در حال ذخیره سازی اطلاعات";
}

function doPost() {
  doLoader();
  document.getElementById("synceMessage").innerHTML = "در حال ذخیره سازی در بانک اصلی";
}

function doNotSaveDb() {
  doOrange();
  document.getElementById("synceMessage").innerHTML = "ذخیره سازی ناموفق در بانک اطلاعات";
}

function displayMessage(message) {
  document.getElementById('messages').innerHTML = message;
}
