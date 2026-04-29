@ECHO OFF
pushd %~dp0

if "%1" == "tags" goto tags
if "%1" == "html" goto html
if "%1" == "clean" goto clean

echo Usage: make.bat [tags^|html^|clean]
goto end

:tags
python docs\build_tags.py
goto end

:html
python docs\build_tags.py
sphinx-build -b html docs docs\_build\html
echo.
echo Done. Serve with:
echo   python -m http.server 8000 --directory docs\_build\html
goto end

:clean
rmdir /s /q docs\_build
goto end

:end
popd
