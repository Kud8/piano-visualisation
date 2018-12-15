import React, {Component} from 'react';
import {OpenSheetMusicDisplay} from 'opensheetmusicdisplay';
import analyze from './utils/analizer';

export class FileInput extends Component {
    componentDidMount() {
        const canvas = document.createElement("div");
        this.setState({
            canvas,
            openSheetMusicDisplay: new OpenSheetMusicDisplay(canvas, {
                autoResize: true,
                backend: 'canvas',
                coloringEnabled: true
            })
        }, () => {
            this.state.openSheetMusicDisplay.setLogLevel('info');
        });
        document.body.appendChild(canvas);
    }

    selectSampleOnChange = (str) => {
        this.state.openSheetMusicDisplay.load(str).then(
            () => this.state.openSheetMusicDisplay.render(),
            (e) => this.errorLoadingOrRenderingSheet(e, "rendering")
        );
    };

    errorLoadingOrRenderingSheet = (e, loadingOrRenderingString) => {
        let errorString = "Error " + loadingOrRenderingString + " sheet: " + e;
        errorString += "\nStackTrace:\n" + e.stack;
        console.warn(errorString);
    };

    uploadFile = (event) => {
        let file = event.target.files[0];
        const reader = new FileReader();
        const filename = file.name;

        reader.onload = (res) => {
            this.selectSampleOnChange(res.target.result);
            const text = res.target.result;

            if (filename.toLowerCase().indexOf(".musicxml") > 0 || filename.toLowerCase().indexOf(".xml") > 0) {
                analyze(text).then((analizedScore) => {
                    this.selectSampleOnChange(analizedScore);
                }).catch((e) => {
                    console.warn("Can't analize this file.");
                });
            } else {
                console.warn("Can't analize this type of file. Please upload .musicxml or .xml");
            }
        };

        if (filename.toLowerCase().indexOf(".xml") > 0
            || filename.toLowerCase().indexOf(".musicxml") > 0) {
            reader.readAsText(file);
        } else if (filename.toLowerCase().indexOf(".mxl") > 0) {
            reader.readAsBinaryString(file);
        } else {
            alert("No vaild .xml/.mxl/.musicxml file!");
        }
    };

    render() {
        return (
            <span>
                <input type="file" name="myFile" onChange={this.uploadFile}/>
            </span>
        )
    }
}
