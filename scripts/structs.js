// ************************************
// Data Structures
// ************************************

// Defines the dataType user object
function DataType(mysql, prisma) {
    this.mysql = mysql;
    this.prisma = prisma;
    this.param = null;
}

DataType.prototype.find = function(dataTypes, typeMysql) {
    function checkType(type) {
        return type.mysql == typeMysql;
    }

    return dataTypes.find(checkType);
};

DataType.prototype.clone = function() {
    return mxUtils.clone(this);
};

// Defines the column user object
function Column(name) {
    this.name = name;
};

Column.prototype.defaultValue = null;

Column.prototype.dataType = 'TEXT'; //new DataType('TEXT', 'String');

Column.prototype.typeParam = null;

Column.prototype.primaryKey = false;

Column.prototype.foreignKey = false;

Column.prototype.autoIncrement = false;

Column.prototype.notNull = false;

Column.prototype.unique = false;

Column.prototype.clone = function() {
    return mxUtils.clone(this);
};

Column.prototype.newCell = function() {
    var obj = new Column('COLUMNNAME');
    column = new mxCell(obj, new mxGeometry(0, 0, 0, 26))
    column.setVertex(true);
    column.setConnectable(false);
    return column;
}

// Defines the table user object
function Table(name) {
    this.name = name;
};

Table.prototype.newCell = function() {
    // Create table
    var obj = new Table('TABLENAME');
    var table = new mxCell(obj, new mxGeometry(0, 0, 250, 28), 'table');
    table.setVertex(true);

    // Adds first column into table
    var column = Column.prototype.newCell();
    var clone = column.clone();

    clone.value.name = 'TABLENAME_ID';
    clone.value.dataType = 'INT' //new DataType('INT', 'Int');
    clone.value.primaryKey = true;
    clone.value.autoIncrement = true;
    clone.value.notNull = true;

    table.insert(clone);

    return table;
}

Table.prototype.clone = function() {
    return mxUtils.clone(this);
};

Table.prototype.create = function(graph, evt, cell, prototype, pt) {
    graph.stopEditing(false);

    if (!pt) {
        pt = graph.getPointForEvent(evt);
    }

    var parent = graph.getDefaultParent();

    var model = graph.getModel();

    var isTable = graph.isSwimlane(prototype);
    var name = null;

    if (!isTable) {
        parent = cell;
        var pstate = graph.getView().getState(parent);

        if (parent == null || pstate == null) {
            mxUtils.alert('Drop target must be a table');
            return;
        }

        pt.x -= pstate.x;
        pt.y -= pstate.y;

        var columnCount = graph.model.getChildCount(parent) + 1;
        //name = mxUtils.prompt('Enter name for new column', 'COLUMN' + columnCount);
        name = 'column' + columnCount;
    } else {
        var tableCount = 0;
        var childCount = graph.model.getChildCount(parent);

        for (var i = 0; i < childCount; i++) {
            if (!graph.model.isEdge(graph.model.getChildAt(parent, i))) {
                tableCount++;
            }
        }

        //var name = mxUtils.prompt('Enter name for new table', 'TABLE' + (tableCount + 1));
        var name = 'Table' + (tableCount + 1);
    }

    if (name != null) {
        var v1 = model.cloneCell(prototype);

        model.beginUpdate();
        try {
            v1.value.name = name;
            v1.geometry.x = pt.x;
            v1.geometry.y = pt.y;

            graph.addCell(v1, parent);

            if (isTable) {
                v1.geometry.alternateBounds = new mxRectangle(0, 0, v1.geometry.width, v1.geometry.height);
                v1.children[0].value.name = 'id';
            }
        } finally {
            model.endUpdate();
        }

        graph.setSelectionCell(v1);
    }
};