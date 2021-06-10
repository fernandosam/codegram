// ************************************
// App
// ************************************
var dataTypes;

mxClient.include('./scripts/utils.js');
mxClient.include('./scripts/structs.js');

function main(container, outline, toolbar, sidebar, status) {
    dataTypes = loadDataTypes('./data/datatypes.txt');

    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
        // Displays an error message if the browser is not supported.
        mxUtils.error('Browser is not supported!', 200, false);
    } else {
        // Global Variables
        var createRelationshipAction = false;
        var createTableAction = false;

        // Specifies shadow opacity, color and offset
        //mxConstants.SHADOW_OPACITY = 0.5;
        //mxConstants.SHADOWCOLOR = '#C0C0C0';
        //mxConstants.SHADOW_OFFSET_X = 4;
        //mxConstants.SHADOW_OFFSET_Y = 5;

        // Specifies font, selection
        mxConstants.DEFAULT_FONTFAMILY = 'Open Sans';
        mxConstants.HANDLE_FILLCOLOR = '#99ccff';
        mxConstants.HANDLE_STROKECOLOR = '#FFCF44';
        mxConstants.VERTEX_SELECTION_COLOR = '#FFCF44';
        mxConstants.VERTEX_SELECTION_STROKEWIDTH = '3';
        mxConstants.VERTEX_SELECTION_DASHED = false;
        mxConstants.EDGE_SELECTION_COLOR = '#FFCF44';
        mxConstants.EDGE_SELECTION_STROKEWIDTH = '3';
        mxConstants.EDGE_SELECTION_DASHED = false;

        // Remove expanded and collapsed images
        mxGraph.prototype.expandedImage = null;
        mxGraph.prototype.collapsedImage = null;

        // Table icon dimensions and position
        mxSwimlane.prototype.imageSize = 15;
        mxSwimlane.prototype.imageDx = 16;
        mxSwimlane.prototype.imageDy = 7;

        // Changes swimlane icon bounds
        mxSwimlane.prototype.getImageBounds = function(x, y, w, h) {
            return new mxRectangle(x + this.imageDx, y + this.imageDy, this.imageSize, this.imageSize);
        };

        // Defines an icon for creating new connections in the connection handler.
        // This will automatically disable the highlighting of the source vertex.
        // var connectHandle = new mxImage('images-custom/round_south_east_white_bg_18dp.png', 15, 15);
        // mxConnectionHandler.prototype.connectImage = connectHandle;

        // Defines a subclass for mxVertexHandler that adds a set of clickable
        // icons to every selected vertex.
        function mxVertexToolHandler(state) {
            mxVertexHandler.apply(this, arguments);
        };

        mxVertexToolHandler.prototype = new mxVertexHandler();
        mxVertexToolHandler.prototype.constructor = mxVertexToolHandler;
        mxVertexToolHandler.prototype.domNode = null;

        mxVertexToolHandler.prototype.init = function() {
            mxVertexHandler.prototype.init.apply(this, arguments);

            // In this example we force the use of DIVs for images in IE. This
            // handles transparency in PNG images properly in IE and fixes the
            // problem that IE routes all mouse events for a gesture via the
            // initial IMG node, which means the target vertices 
            this.domNode = document.createElement('div');
            this.domNode.style.position = 'absolute';
            this.domNode.style.whiteSpace = 'nowrap';

            // Workaround for event redirection via image tag in quirks and IE8
            function createImage(src) {
                if (mxClient.IS_IE && !mxClient.IS_SVG) {
                    var img = document.createElement('div');
                    img.style.backgroundImage = 'url(' + src + ')';
                    img.style.backgroundPosition = 'center';
                    img.style.backgroundRepeat = 'no-repeat';
                    img.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';

                    return img;
                } else {
                    return mxUtils.createImage(src);
                }
            };

            // Connect
            var img = createImage('images/relation.png');
            //img.setAttribute('title', 'Connect');
            img.style.cursor = 'pointer';
            img.style.width = '16px';
            img.style.height = '16px';

            mxEvent.addListener(img, 'click',
                mxUtils.bind(this, function(evt) {
                    var pt = mxUtils.convertPoint(this.graph.container,
                        mxEvent.getClientX(evt), mxEvent.getClientY(evt));
                    this.graph.connectionHandler.start(this.state, pt.x, pt.y);
                    this.graph.isMouseDown = false;
                    this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
                    mxEvent.consume(evt);
                }));

            this.domNode.appendChild(img);

            this.graph.container.appendChild(this.domNode);
            this.redrawTools();
        };

        mxVertexToolHandler.prototype.redraw = function() {
            mxVertexHandler.prototype.redraw.apply(this);
            this.redrawTools();
        };

        mxVertexToolHandler.prototype.redrawTools = function() {
            if (this.state != null && this.domNode != null) {
                var dy = (mxClient.IS_VML && document.compatMode == 'CSS1Compat') ? 20 : 4;
                this.domNode.style.left = (this.state.x + this.state.width - 16) + 'px';
                this.domNode.style.top = (this.state.y + dy - 25) + 'px';
            }
        };

        mxVertexToolHandler.prototype.destroy = function(sender, me) {
            mxVertexHandler.prototype.destroy.apply(this, arguments);

            if (this.domNode != null) {
                this.domNode.parentNode.removeChild(this.domNode);
                this.domNode = null;
            }
        };

        // Rounded edge and vertex handles
        //var touchHandle = new mxImage('images/handle-main.png', 17, 17);
        //mxVertexHandler.prototype.handleImage = touchHandle;
        //mxEdgeHandler.prototype.handleImage = touchHandle;
        //mxOutline.prototype.sizerImage = touchHandle;

        // Prefetches all images that appear in colums
        // to avoid problems with the auto-layout
        var keyImage = new Image();
        keyImage.src = "images/key.png";

        var plusImage = new Image();
        plusImage.src = "images/plus.png";

        var checkImage = new Image();
        checkImage.src = "images/check.png";

        // Workaround for Internet Explorer ignoring certain CSS directives
        if (mxClient.IS_QUIRKS) {
            document.body.style.overflow = 'hidden';
            new mxDivResizer(container);
            new mxDivResizer(outline);
            new mxDivResizer(toolbar);
            new mxDivResizer(sidebar);
            new mxDivResizer(status);
        }

        // Creates the graph inside the given container. The
        // editor is used to create certain functionality for the
        // graph, such as the rubberband selection, but most parts
        // of the UI are custom in this example.
        var editor = new mxEditor();
        var graph = editor.graph;
        var model = graph.model;

        // Disables some global features
        graph.setConnectable(true);
        graph.setCellsDisconnectable(false);
        graph.setCellsCloneable(false);
        graph.swimlaneNesting = false;
        graph.dropEnabled = true;

        // Do not allow removing labels from parents
        graph.graphHandler.removeCellsFromParent = false;

        // Does not allow dangling edges
        graph.setAllowDanglingEdges(false);

        // Forces use of default edge in mxConnectionHandler
        graph.connectionHandler.factoryMethod = null;

        // Extends Canvas

        // Only tables are resizable
        graph.isCellResizable = function(cell) {
            return false; //this.isSwimlane(cell);
        };

        // Only tables are movable
        graph.isCellMovable = function(cell) {
            return true; //this.isSwimlane(cell); // Only tables are movable
        };

        // Enables wrapping for vertex labels
        graph.isWrapping = function(cell) {
            return this.model.isCollapsed(cell);
        };

        // Graph handler
        graph.createHandler = function(state) {
            if (state != null &&
                graph.isHtmlLabel(state.cell)) {
                showPanelColumn(graph, state.cell);
            }

            if (state != null &&
                this.model.isVertex(state.cell) && state.cell.style == 'table') {
                showPanelTable(graph, state.cell);
                return new mxVertexToolHandler(state);
            }

            return mxGraph.prototype.createHandler.apply(this, arguments);
        };

        // Sets the graph container and configures the editor
        editor.setGraphContainer(container);
        var config = mxUtils.load(
            'editors/config/keyhandler-minimal.xml').
        getDocumentElement();
        editor.configure(config);

        // Configures the automatic layout for the table columns
        editor.layoutSwimlanes = true;
        editor.createSwimlaneLayout = function() {
            var layout = new mxStackLayout(this.graph, false);
            layout.fill = true;
            layout.resizeParent = true;

            // Overrides the function to always return true
            layout.isVertexMovable = function(cell) {
                return true;
            };

            return layout;
        };

        // Text label changes will go into the name field of the user object
        graph.model.valueForCellChanged = function(cell, value) {
            if (value.name != null) {
                return mxGraphModel.prototype.valueForCellChanged.apply(this, arguments);
            } else {
                var old = cell.value.name;
                cell.value.name = value;
                return old;
            }
        };

        // Columns are dynamically created HTML labels
        graph.isHtmlLabel = function(cell) {
            return !this.isSwimlane(cell) && !this.model.isEdge(cell);
        };

        // Edges are not editable
        graph.isCellEditable = function(cell) {
            return !this.model.isEdge(cell);
        };

        // Returns the name field of the user object for the label
        graph.convertValueToString = function(cell) {
            if (cell.value != null && cell.value.name != null) {
                return cell.value.name;
            }

            return mxGraph.prototype.convertValueToString.apply(this, arguments); // "supercall"
        };

        // Returns the type as the tooltip for column cells
        graph.getTooltip = function(state) {
            /*
            if (this.isHtmlLabel(state.cell)) {
                return 'Type: ' + state.cell.value.dataType.mysql;
            } else if (this.model.isEdge(state.cell)) {
                var source = this.model.getTerminal(state.cell, true);
                var parent = this.model.getParent(source);

                return parent.value.name + '.' + source.value.name;
            }

            return mxGraph.prototype.getTooltip.apply(this, arguments); // "supercall"
            */
            return null;
        };

        // Creates a dynamic HTML label for column fields
        graph.getLabel = function(cell) {

            if (this.isHtmlLabel(cell)) {
                var label = '';
                if (cell.value.primaryKey) {
                    label += '<img title="Primary Key" src="images/key_pk.png" class="align-center">&nbsp;';
                } else if (cell.value.foreignKey) {
                    label += '<img title="Foreign Key" src="images/key_fk.png" class="align-center">&nbsp;';
                } else {
                    label += '<img src="images/spacer.gif" height="1" class="align-center">&nbsp;';
                }

                if (cell.value.autoIncrement) {
                    label += '<img title="Auto Increment" src="images/plus.png" class="align-center">&nbsp;';
                } else if (cell.value.unique) {
                    label += '<img title="Unique" src="images/check.png" class="align-center">&nbsp;';
                } else {
                    label += '<img src="images/spacer.gif" height="1" class="align-center">&nbsp;';
                }

                //var dataTypeParam = (cell.value.dataType.param) ? '(' + cell.value.dataType.param + ')' : '';
                var nullValue = (cell.value.notNull) ? '' : 'NULL';
                var uniqueValue = (cell.value.unique) ? 'UNIQ' : '';
                var opcNullUnique = (cell.value.unique) ? uniqueValue : nullValue;

                var pkValue = (cell.value.primaryKey) ? 'PK' : '';
                var fkValue = (cell.value.foreignKey) ? 'FK' : '';

                //console.log(cell.value.dataType);

                var table = "<div class='grid-table-row'><div>" + mxUtils.htmlEntities(cell.value.name, false) + "</div>";
                table = table + "<div style='color:#FF6859;'>" + mxUtils.htmlEntities(cell.value.dataType, false) + "</div>";
                table = table + "<div>" + opcNullUnique + "</div>";
                table = table + "<div style='color:#FFCF44;'>" + pkValue + "</div>";
                table = table + "<div style='color:#B15DFF;'>" + fkValue + "</div></div>";

                //mxUtils.htmlEntities(cell.value.name, false) + '&#9;' + mxUtils.htmlEntities(cell.value.dataType.mysql, false);

                return table;
            }

            if (this.getModel().isEdge(cell)) {
                return cell.value.name;
            }

            return mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
        };

        // ************************************
        // Listeners
        // ************************************

        // Add a table in graph
        graph.addListener(mxEvent.CLICK, function(sender, evt) {
            if (createTableAction) {
                var me = evt.getProperty('event');
                var table = Table.prototype.newCell();

                var cell = graph.getModel().getParent(table);

                var pt = mxUtils.convertPoint(graph.container,
                    mxEvent.getClientX(me), mxEvent.getClientY(me));

                Table.prototype.create.call(this, graph, evt, cell, table, pt);

                document.body.style.cursor = 'auto';
                createTableAction = false;
            }

            // Create Relationship
            if (createRelationshipAction) {
                var cell = evt.getProperty('cell');
                var createEvent = false;

                if (graph.isSwimlane(cell)) {
                    createEvent = true;
                } else if (graph.isSwimlane(graph.getModel().getParent(cell))) {
                    cell = graph.getModel().getParent(cell);
                    createEvent = true;
                }

                if (createEvent) {
                    var state = graph.getView().getState(cell);

                    graph.connectionHandler.start(state, 0, 0);
                    graph.isMouseDown = false;
                    graph.isMouseTrigger = true;
                } else {
                    showAlert('Click on a target table');
                }

                createRelationshipAction = false;
                document.body.style.cursor = 'auto';
            }
        });

        // Removes the source vertex if edges are removed
        graph.addListener(mxEvent.REMOVE_CELLS, function(sender, evt) {
            var cells = evt.getProperty('cells');

            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];

                if (this.model.isEdge(cell)) {
                    var terminal = this.model.getTerminal(cell, true);
                    var parent = this.model.getParent(terminal);

                    this.model.remove(terminal);
                }
            }
        });

        // Change edges label when vertex are changed
        graph.addListener(mxEvent.LABEL_CHANGED, function(sender, evt) {
            var cell = evt.getProperty('cell');
            var edgesCount = cell.getEdgeCount();

            for (var i = 0; i < edgesCount; i++) {
                var edge = cell.getEdgeAt(i);

                var label = {};
                label.name = cell.value.name;

                graph.model.setValue(edge, label);
            }
        });

        // Disables drag-and-drop into non-swimlanes.
        graph.isValidDropTarget = function(cell, cells, evt) {
            return this.isSwimlane(cell);
        };

        // Installs a popupmenu handler using local function (see below).
        graph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
            createPopupMenu(editor, graph, menu, cell, evt);
        };

        // Adds all required styles to the graph (see below)
        configureStylesheet(graph);

        // Adds table icon
        //var table = Table.prototype.newCell();
        //addSidebarIcon(graph, sidebar, table, 'images/icons48/table.png');

        // Adds column icon
        //var column = Column.prototype.newCell();
        //addSidebarIcon(graph, sidebar, column, 'images/icons48/column.png');

        // Adds child columns for new connections between tables
        graph.addEdge = function(edge, parent, source, target, index) {
            // Finds the primary key child of the target table
            var primaryKey = null;
            var childCount = this.model.getChildCount(source);

            for (var i = 0; i < childCount; i++) {
                var child = this.model.getChildAt(source, i);

                if (child.value.primaryKey) {
                    primaryKey = child;
                    break;
                }
            }

            if (primaryKey == null) {
                mxUtils.alert('Target table must have a primary key');
                return;
            }

            this.model.beginUpdate();
            try {
                var col1 = this.model.cloneCell(column);
                //col1.value.name = primaryKey.value.name;

                col1.value.name = source.value.name.toLowerCase() + '_id';
                col1.value.dataType = primaryKey.value.dataType;
                col1.value.notNull = true;
                col1.value.foreignKey = true;

                this.addCell(col1, target);

                source = col1;
                target = primaryKey;

                var label = {};
                label.name = col1.value.name;

                edge.value = label;

                return mxGraph.prototype.addEdge.apply(this, arguments); // "supercall"
            } finally {
                this.model.endUpdate();
            }

            return null;
        };

        // Defines a new export action
        editor.addAction('properties', function(editor, cell) {
            if (cell == null) {
                cell = graph.getSelectionCell();
            }

            if (graph.isHtmlLabel(cell)) {
                showPanelColumn(graph, cell);
            }
        });

        // ************************************
        // Toolbar Actions
        // ************************************

        var actions = document.querySelectorAll('[action]');

        for (var i = 0; i < actions.length; i++) {
            if (actions[i].nodeName == 'svg') {
                var node = actions[i];
                var action = node.getAttribute("action");
                var popper;
                var tooltip;

                node.addEventListener("mouseover", function() {
                    var actionEvent = this.getAttribute("action");
                    var icon = document.querySelector("[action=" + actionEvent + "]");

                    var iconText = icon.getAttribute("tooltip");
                    var tooltipTextDom = document.querySelector("#tooltip-text");
                    tooltip = document.querySelector("#tooltip");
                    tooltip.setAttribute('data-show', '');

                    if (tooltip && iconText) {
                        tooltipTextDom.innerHTML = iconText;
                        popper = Popper.createPopper(icon, tooltip, {
                            placement: 'bottom',
                            modifiers: [{
                                name: 'offset',
                                options: {
                                    offset: [0, 8],
                                },
                            }, ]
                        })
                    }
                });

                node.addEventListener("mouseout", function() {
                    if (popper) {
                        tooltip.removeAttribute('data-show');
                        popper.destroy();
                    }
                });

                if (action) {
                    addToolbarIcon(editor, action, node);
                }
            }
        }

        //addToolbarIcon(editor, toolbar, 'show', 'Show', 'images/camera.png');
        //addToolbarIcon(editor, toolbar, 'print', 'Print', 'images/printer.png');

        // Create a new project
        editor.addAction('newProject', function(editor, cell) {
            location.reload();
        });

        // Open a project
        editor.addAction('saveProject', function(editor, cell) {
            //mxUtils.alert('Not implemented');
            saveProject(editor, 'project');
            showAlert('Project saved successfully', 'success');
        });

        // Create a new table
        editor.addAction('createTable', function(editor, cell) {
            document.body.style.cursor = 'url(./images/table.svg), pointer';
            createTableAction = true;
        });

        // Create a new relationship
        editor.addAction('createRelationship', function(editor, cell) {
            document.body.style.cursor = 'url(./images/relationship.svg), pointer';
            createRelationshipAction = true;
        });

        // Defines a create SQL action
        editor.addAction('showSql', function(editor, cell) {
            var sql = createSql(graph);

            if (sql.length > 0) {
                modalTemplate(sql, 'sql');
            } else {
                mxUtils.alert('Schema is empty');
            }
        });

        // Defines a create Prisma action
        editor.addAction('showPrisma', function(editor, cell) {
            var prisma = createPrisma(graph);

            if (prisma.length > 0) {
                modalTemplate(prisma, 'graphql');
            } else {
                mxUtils.alert('Schema is empty');
            }
        });

        // Defines export XML action
        editor.addAction('export', function(editor, cell) {
            var textarea = document.createElement('textarea');
            textarea.style.width = '400px';
            textarea.style.height = '400px';
            var enc = new mxCodec(mxUtils.createXmlDocument());
            var node = enc.encode(editor.graph.getModel());
            textarea.value = mxUtils.getPrettyXml(node);
            showModalWindow('XML', textarea, 410, 440);
        });

        // Open project
        openProject(editor, 'project');

        // Creates the outline (navigator, overview) for moving
        // around the graph in the top, right corner of the window.
        var outln = new mxOutline(graph, outline);

        // Fades-out the splash screen after the UI has been loaded.
        var splash = document.getElementById('splash');
        if (splash != null) {
            try {
                mxEvent.release(splash);
                mxEffects.fadeOut(splash, 100, true);
            } catch (e) {

                // mxUtils is not available (library not loaded)
                splash.parentNode.removeChild(splash);
            }
        }
    }
}

function addToolbarIcon(editor, action, node) {
    mxEvent.addListener(node, 'click', function(evt) {
        editor.execute(action);
    });
};

function showModalWindow(title, content, width, height) {
    var background = document.createElement('div');
    background.style.position = 'absolute';
    background.style.left = '0px';
    background.style.top = '0px';
    background.style.right = '0px';
    background.style.bottom = '0px';
    background.style.background = 'black';
    mxUtils.setOpacity(background, 50);
    document.body.appendChild(background);

    if (mxClient.IS_QUIRKS) {
        new mxDivResizer(background);
    }

    var x = Math.max(0, document.body.scrollWidth / 2 - width / 2);
    var y = Math.max(10, (document.body.scrollHeight ||
        document.documentElement.scrollHeight) / 2 - height * 2 / 3);
    var wnd = new mxWindow(title, content, x, y, width, height, false, true);
    wnd.setClosable(true);

    // Fades the background out after after the window has been closed
    wnd.addListener(mxEvent.DESTROY, function(evt) {
        mxEffects.fadeOut(background, 50, true,
            10, 30, true);
    });

    wnd.setVisible(true);

    return wnd;
};

function addSidebarIcon(graph, sidebar, prototype, image) {
    // Function that is executed when the image is dropped on
    // the graph. The cell argument points to the cell under
    // the mousepointer if there is one.
    var funct = function(graph, evt, cell) {
        Table.prototype.create.call(this, graph, evt, cell, prototype);
    }

    // Creates the image which is used as the sidebar icon (drag source)
    var img = document.createElement('img');
    img.setAttribute('src', image);
    img.style.width = '48px';
    img.style.height = '48px';
    img.title = 'Drag this to the diagram to create a new vertex';
    sidebar.appendChild(img);


    // Creates the image which is used as the drag icon (preview)
    var dragImage = img.cloneNode(true);
    var ds = mxUtils.makeDraggable(img, graph, funct, dragImage);


    // Adds highlight of target tables for columns
    ds.highlightDropTargets = true;
    ds.getDropTarget = function(graph, x, y) {
        if (graph.isSwimlane(prototype)) {
            return null;
        } else {
            var cell = graph.getCellAt(x, y);

            if (graph.isSwimlane(cell)) {
                return cell;
            } else {
                var parent = graph.getModel().getParent(cell);

                if (graph.isSwimlane(parent)) {
                    return parent;
                }
            }
        }
    };
};

function configureStylesheet(graph) {
    var style = new Object();
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    style[mxConstants.STYLE_FILLCOLOR] = '#282828';
    style[mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
    style[mxConstants.STYLE_FONTSIZE] = '12';
    style[mxConstants.STYLE_FONTSTYLE] = 0;
    style[mxConstants.STYLE_SPACING_LEFT] = '5';
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    //style[mxConstants.STYLE_GRADIENTCOLOR] = '#FFFFFF';
    //style[mxConstants.STYLE_FILLCOLOR] = '#000000';
    style[mxConstants.STYLE_SWIMLANE_FILLCOLOR] = '#121212';
    style[mxConstants.STYLE_STROKECOLOR] = '#045D56'; //1B78C8
    style[mxConstants.STYLE_STROKEWIDTH] = '1';

    graph.getStylesheet().putDefaultVertexStyle(style);

    style = new Object();
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    style[mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
    style[mxConstants.STYLE_STARTSIZE] = '20';
    style[mxConstants.STYLE_VERTICAL_ALIGN] = 'middle';
    style[mxConstants.STYLE_FONTSIZE] = '12';
    style[mxConstants.STYLE_FILLCOLOR] = '#045D56';
    style[mxConstants.STYLE_STROKEWIDTH] = '5';
    //style[mxConstants.STYLE_FONTSTYLE] = 1;
    //style[mxConstants.STYLE_IMAGE] = 'images/icons48/table.png';
    // Looks better without opacity if shadow is enabled
    //style[mxConstants.STYLE_OPACITY] = '80';
    //style[mxConstants.STYLE_SHADOW] = 1;
    graph.getStylesheet().putCellStyle('table', style);

    //style = graph.stylesheet.getDefaultEdgeStyle();
    style = new Object();
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_CONNECTOR;
    style[mxConstants.STYLE_STROKECOLOR] = '#606060'; //6482B9
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
    //style[mxConstants.STYLE_STARTARROW] = mxConstants.ARROW_OVAL;
    style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_OVAL; //ARROW_CLASSIC
    style[mxConstants.STYLE_FONTSIZE] = '10';
    style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
    style[mxConstants.STYLE_FILLCOLOR] = '#000000'; //8CCDF5
    style[mxConstants.STYLE_STROKEWIDTH] = '3';
    style[mxConstants.STYLE_ROUNDED] = true;
    style['sourcePerimeterSpacing'] = 2;
    style['targetPerimeterSpacing'] = 7;

    graph.getStylesheet().putDefaultEdgeStyle(style);
};

// Function to create the entries in the popupmenu
function createPopupMenu(editor, graph, menu, cell, evt) {
    if (cell != null) {
        var cellName;
        var parent;

        if (graph.model.isEdge(cell)) {
            cellName = 'Relationship';
            parent = cell.parent;
        } else if (graph.isHtmlLabel(cell)) {
            cellName = 'Column';
            parent = cell.parent;
        } else {
            cellName = 'Table';
            parent = cell;
        }

        if (!graph.model.isEdge(cell)) {
            menu.addItem('Add Column', 'images/add.svg', function() {
                var column = Column.prototype.newCell();
                Table.prototype.create(graph, evt, parent, column, null);
            });
        }

        if (graph.isHtmlLabel(cell)) {
            menu.addItem('Edit Column', 'images/edit.svg', function() {
                editor.execute('properties', cell);
            });
        }

        menu.addSeparator();

        menu.addItem('Delete ' + cellName, 'images/trash.svg', function() {
            editor.execute('delete', cell);
        });
    }

    /*
    menu.addItem('Undo', 'images/undo.png', function() {
        editor.execute('undo', cell);
    });

    menu.addItem('Redo', 'images/redo.png', function() {
        editor.execute('redo', cell);
    });

    menu.addSeparator();

    menu.addItem('Show SQL', 'images/export1.png', function() {
        editor.execute('showSql', cell);
    });
    */
};

function showPanelColumn(graph, cell) {
    // Form to Column
    var formColumn = new mxForm('properties');
    var nameField = formColumn.addText('Name', cell.value.name);
    var typeField = formColumn.addCombo('Data Type', false, 1);
    for (var i = 0; i < dataTypes.length; i++) {
        formColumn.addOption(typeField, dataTypes[i].mysql, dataTypes[i].mysql, cell.value.dataType == dataTypes[i].mysql);
    }
    var typeParamField = formColumn.addText('Custom Size', cell.value.typeParam);

    // Form Constraints
    var formConstraint = new mxForm('properties');
    var notNullField = formConstraint.addCheckbox('Not Null', cell.value.notNull);
    var uniqueField = formConstraint.addCheckbox('Unique', cell.value.unique);
    var useDefaultField = formConstraint.addCheckbox('Use Default', (cell.value.defaultValue != null));
    var defaultField = formConstraint.addText('Default', cell.value.defaultValue || '');

    // Form Options
    var formOptions = new mxForm('properties');
    var autoIncrementField = formOptions.addCheckbox('Auto Increment', cell.value.autoIncrement);

    // Form to key
    var formKey = new mxForm('properties');
    var primaryKeyField = formKey.addCheckbox('Primary Key', cell.value.primaryKey);
    var foreignKeyField = formKey.addCheckbox('Foreign Key', cell.value.foreignKey);

    // Function to be executed when change values
    var okFunction = function() {
        var clone = cell.value.clone();

        clone.name = nameField.value;
        clone.dataType = typeField.value; //DataType.prototype.find(dataTypes, typeField.value);
        clone.typeParam = typeParamField.value;

        if (useDefaultField.checked) {
            clone.defaultValue = defaultField.value;
        } else {
            clone.defaultValue = null;
        }

        clone.primaryKey = primaryKeyField.checked;
        clone.foreignKey = foreignKeyField.checked;
        clone.autoIncrement = autoIncrementField.checked;
        clone.notNull = notNullField.checked;
        clone.unique = uniqueField.checked;

        graph.model.setValue(cell, clone);
    }

    //var parent = graph.model.getParent(cell);
    destroyAllPanelElements();

    // Panel Elements
    createPanelElement('Column', formColumn.table, okFunction);
    createPanelElement('Constraints', formConstraint.table, okFunction);
    createPanelElement('Options', formOptions.table, okFunction);
    createPanelElement('Keys', formKey.table, okFunction);
};

function showPanelTable(graph, cell) {
    // Form to table
    var formTable = new mxForm('properties');
    var nameField = formTable.addText('Name', cell.value.name);

    // Function to be executed when change values
    var okFunction = function() {
        var clone = cell.value.clone();

        clone.name = nameField.value;

        graph.model.setValue(cell, clone);
    }

    destroyAllPanelElements();
    // Panel Elements
    createPanelElement('Table', formTable.table, okFunction);
}


// ************************************
// SQL and Prisma generators
// ************************************

function foreignKeysConfig(graph) {
    var references = [];
    var parent = graph.getDefaultParent();
    var childCount = graph.model.getChildCount(parent);

    // ForeignKeys
    for (var i = 0; i < childCount; i++) {
        var child = graph.model.getChildAt(parent, i);

        if (graph.model.isEdge(child)) {
            var targetParent = graph.model.getParent(child.target);
            var targetSource = graph.model.getParent(child.source);

            var tableOrigin = targetSource.value.name;
            var columnOrigin = child.source.value.name;
            var tableReference = targetParent.value.name;
            var columnReference = child.target.value.name;

            var ref = {};
            ref.table = tableReference;
            ref.column = columnReference;

            references[tableOrigin + '-' + columnOrigin] = ref;
        }
    }

    return references;
}

function createSql(graph) {
    var sql = [];
    var references = foreignKeysConfig(graph);
    var parent = graph.getDefaultParent();
    var childCount = graph.model.getChildCount(parent);

    // Models
    var foreignKeys = [];
    for (var i = 0; i < childCount; i++) {
        var child = graph.model.getChildAt(parent, i);

        if (!graph.model.isEdge(child)) {
            var table = child.value.name;

            sql.push('CREATE TABLE IF NOT EXISTS ' + table + ' (');

            var columnCount = graph.model.getChildCount(child);

            if (columnCount > 0) {
                for (var j = 0; j < columnCount; j++) {
                    var column = graph.model.getChildAt(child, j).value;
                    var dataTypeParam = (column.dataType.param) ? '(' + column.dataType.param + ')' : '';

                    sql.push('\n    ' + column.name + ' ' + column.dataType + dataTypeParam);

                    if (column.primaryKey) {
                        sql.push(' PRIMARY KEY');
                    }

                    if (column.autoIncrement) {
                        sql.push(' AUTO_INCREMENT');
                    }

                    if (column.unique) {
                        sql.push(' UNIQUE');
                    }

                    if (column.notNull) {
                        sql.push(' NOT NULL');
                    }

                    if (column.defaultValue != null) {
                        sql.push(' DEFAULT ' + column.defaultValue);
                    }

                    sql.push(',');

                    if (column.foreignKey) {
                        var columnName = column.name;
                        var ref = references[table + '-' + columnName];

                        var sqlFk = 'ALTER TABLE ' + table + ' ADD FOREIGN KEY (FK_' + table + '_' +
                            columnName + '_' + ref.table + ') REFERENCES ' + ref.table + '(' + ref.column + ')';
                        foreignKeys.push(sqlFk);
                    }
                }

                sql.splice(sql.length - 1, 1);
                sql.push('\n);');
            }

            sql.push('\n');
        }
    }

    for (var key in foreignKeys) {
        sql.push(foreignKeys[key]);
        sql.push('\n');
        //console.log(key, references[key]);
    }

    return sql.join('');
};

function createPrisma(graph) {
    var sql = [];
    var references = foreignKeysConfig(graph);
    var parent = graph.getDefaultParent();
    var childCount = graph.model.getChildCount(parent);

    // Models
    var foreignKeys = [];
    for (var i = 0; i < childCount; i++) {
        var child = graph.model.getChildAt(parent, i);

        if (!graph.model.isEdge(child)) {
            var table = child.value.name;

            sql.push('model ' + table + ' {');

            var columnCount = graph.model.getChildCount(child);

            if (columnCount > 0) {
                for (var j = 0; j < columnCount; j++) {
                    var column = graph.model.getChildAt(child, j).value;
                    var typePrisma = DataType.prototype.find(dataTypes, column.dataType).prisma;
                    var notnull = (column.notNull) ? "" : "?";

                    sql.push('\n    ' + column.name + ' ' + typePrisma + notnull);

                    if (column.primaryKey) {
                        sql.push(' @id');
                    }

                    if (column.autoIncrement) {
                        sql.push(' @default(autoincrement())');
                    }

                    if (column.unique) {
                        sql.push(' @unique');
                    }

                    if (column.defaultValue != null) {
                        sql.push(' @default(' + column.defaultValue + ')');
                    }

                    sql.push(',');

                    if (column.foreignKey) {
                        var columnName = column.name;
                        var ref = references[table + '-' + columnName];

                        var fieldsP = columnName;
                        var referencesP = table;

                        if (columnName.slice(-3) == "_id") {
                            columnName = columnName.substring(0, columnName.length - 3);
                        }

                        sql.push('\n    ' + columnName + ' ' + ref.table + ' @relation(fields:[' + fieldsP + '], references:[' + ref.column + '])');
                        sql.push(',');
                    }
                }

                sql.splice(sql.length - 1, 1);
                sql.push('\n}');
            }

            sql.push('\n\n');
        }
    }

    for (var key in foreignKeys) {
        sql.push(foreignKeys[key]);
        sql.push('\n');
        //console.log(key, references[key]);
    }

    return sql.join('');
};