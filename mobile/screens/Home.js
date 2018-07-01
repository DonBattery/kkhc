import React from 'react';
import { View, Text, Button, ImageBackground, Image, ScrollView, TouchableOpacity, TouchableHighlight } from 'react-native';
import { ImageModal } from './../modal/imageModal';

export class HomeScreen extends React.Component {

  constructor(){
        super();
        this.state = {
            rootFolder: { contains: [] },
            placeIndicator: [],
        }
    }

  componentWillMount() {
    this.fetchFolders(0);
    }

  fetchFolders = async (hash) => {
    try {
      let response = await fetch(
        `http://10.1.10.24:3099/folder/${hash}`,
          {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
    }});
      let rootFolder = await response.json();

      this.state.placeIndicator.push(hash);
      this.setState({
        rootFolder: rootFolder,
      })
    } catch (error) {
      console.error(error);
    }
  };

  loadInnerFolder(folder) {
    this.fetchFolders(folder.hash);
  }

  inspectImage(imageObject) {
    this.child.openModal(imageObject);
  }

  renderImages() {
    return this.state.rootFolder.contains.map((fileObject, index) =>{
      if (fileObject.type === 'file') {
        return <TouchableHighlight onPress={() => this.inspectImage(fileObject)} key={index}>
        <Image
        source={{uri: `http://10.1.10.24:3099${this.state.rootFolder.path}/${fileObject.name}`}}
        style={{width: 138, height: 138}} />
        </TouchableHighlight>
      } else {
        return <TouchableOpacity
        key={index}
        onPress={() => this.loadInnerFolder(fileObject)}
        ><Text>{fileObject.name}</Text></TouchableOpacity>
      }
    })
  }

  goBack(hash, index) {
    this.state.placeIndicator.splice(index, this.state.placeIndicator.length)
    this.fetchFolders(hash)
  }

  renderDirectoryNavigators() {
    let indicatorButtonList = this.state.rootFolder.path.replace('/opt/images', '').split('/')
    return indicatorButtonList.map((button, index) => {
      return <Button key={index} title={button ? button : 'root'} onPress={() => this.goBack(this.state.placeIndicator[index], index)}></Button>
    })
  }

  render() {
    if(!this.state.rootFolder.contains.length)
        return null;
    return (
      <ImageBackground source={require('./pics.png')} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5FCFF" }}>
      <ImageModal ref={(ref) => { this.child = ref; }} />
      <View>
      <Text>hajjj</Text>
      </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '80%', height: '80%', backgroundColor: 'red' }}>
          {this.renderDirectoryNavigators()}
          {this.renderImages()}
          <Button
            title="Go to Details"
            onPress={() => console.log(this.state)}
          />
        </View>
      </ImageBackground>
    );
  }
}