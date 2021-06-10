<p align="center">
  <img width="144px" src="" />
</p>

<h1 align="center">codegram</h1>
<p align="center">A tool to convert the relational model into SQL or Prima</p>
<p align="center"><b>Visual programming, low-code tool, relational model visual editor</b></p>
<p align="center">Demo</p>

## Features

### Relational model visual editor

Visually create and edit tables, attributes, relationships between tables. Undo, redo, zoom, collapse and expand the model.

### Save the relational model

Saves the model in memory for use after closing the browser. It currently does not support model history.

### Export to SQL, Prisma or XML

Export the resulting model to SQL or [Prisma](https://www.prisma.io/) language. It is also possible to export the resulting model to XML.

## Installation

1. Download the codegram [zip](https://github.com/fernandosam/codegram/archive/refs/heads/main.zip) or use git and clone the codegram `main` repo:

```bash
git clone https://github.com/fernandosam/codegram.git
cd codegram
```

2. Install http-server:

```bash
npm install --global http-server
```

3. In codegram folder run:

```bash
http-server
```

4. Access the following address in your browser:

```bash
http://127.0.0.1:8080/
```

### Resources

Working in progress... (new contributors are welcome)

## Contributing

For document & bug fix, please create pull request to `master` branch.
For new features, please create pull request to `feat` branch.

## License

codegram is licensed under the [MIT license](https://opensource.org/licenses/MIT).

mxGraph (codegram dependency) is licensed under the [Apache License 2.0](https://opensource.org/licenses/Apache-2.0).