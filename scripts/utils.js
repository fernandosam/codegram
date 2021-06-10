// ************************************
// Utils functions
// ************************************

// Custom load data for dataType
function loadDataTypes(filename) {
    var req = mxUtils.load(filename);
    var text = req.getText();

    var lines = text.split('\n');
    var idx = 0;
    var dataTypes = [];

    // Parses all lines
    for (var i = 0; i < lines.length; i++) {
        // Ignores comments and /n lines (starting with #)
        if (lines[i].substring(0, 1) != "#" && lines[i].length > 1) {
            var line = lines[i].substring(0, lines[i].length - 1);
            var columns = line.split(',');

            var dataType = new DataType(columns[0], columns[1]);

            dataTypes.push(dataType);
        }
    }

    return dataTypes;
};

// Saves the current graph under the given filename.
function saveProject(editor, name) {
    if (name != null) {
        if (editor.graph.isEditing()) {
            editor.graph.stopEditing();
        }

        var enc = new mxCodec(mxUtils.createXmlDocument());
        var node = enc.encode(editor.graph.getModel());
        var xml = mxUtils.getXml(node);

        try {
            localStorage.setItem(name, xml);
            editor.setStatus(mxUtils.htmlEntities(mxResources.get('saved')) + ' ' + new Date());
            editor.setModified(false);
        } catch (e) {
            console.log(e);
            //editor.setStatus(mxUtils.htmlEntities(mxResources.get('errorSavingFile')));
        }
    }
};

// Opens the current diagram
function openProject(editor, name) {
    try {
        var xml = localStorage.getItem(name);
        var doc = mxUtils.parseXml(xml);
        var node = doc.documentElement;

        editor.readGraphModel(node);
        editor.setModified(false);
        editor.undoManager.clear();
    } catch (e) {
        console.log(e);
    }

    editor.graph.view.validate();
    editor.graph.sizeDidChange();
};

// Create modal template
function modalTemplate(codePlain, language) {
    var pre = document.createElement('pre');
    var code = document.createElement('code');
    code.setAttribute("class", "language-" + language);
    code.innerHTML = codePlain;
    pre.appendChild(code);

    var c = document.getElementById('modal-content');
    if (c.childNodes.length > 0) {
        c.removeChild(c.childNodes[0]);
    }
    c.appendChild(pre);
    Prism.highlightAll();

    var mc = document.getElementById('modal-check');
    mc.checked = true;
}


// Create alert template
function showAlert(msg, type) {
    if (!type) type = 'danger';

    var c = document.getElementById('alert-content');
    c.parentNode.setAttribute("class", type + "-alert alert");
    c.innerHTML = msg;

    var mc = document.getElementById('alert-check');
    mc.checked = true;

    setTimeout(function() { mc.checked = false; }, 2000);
}

// Create panel element
function createPanelElement(title, content, okFunction) {
    var c = document.getElementById('panel-right');

    // Summary
    var summary = document.createElement('summary');
    summary.innerText = title;

    // Details
    var details = document.createElement('details');
    details.setAttribute("open", '');
    details.appendChild(summary);
    details.appendChild(content);

    c.appendChild(details);

    var inputs = document.querySelectorAll('.properties input, .properties select');

    for (index = 0; index < inputs.length; ++index) {
        inputs[index].addEventListener("change", okFunction);
    }
}

// Destroy all panel elements
function destroyAllPanelElements() {
    var c = document.getElementById('panel-right');

    while (c.childNodes.length > 0) {
        c.removeChild(c.childNodes[0]);
    }
}