{
  mkShell,
  python3Packages,
}:
mkShell {
  buildInputs = with python3Packages; [mesa jupyter pandas pyarrow bokeh matplotlib];
}
