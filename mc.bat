@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\main" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\main" %*
)