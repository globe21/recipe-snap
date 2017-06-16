import React from 'react'
import { ImagePicker } from 'expo'
import { Button, Image, View, Text, ImageEditor, ImageStore } from 'react-native'
import { connect } from 'react-redux'

import styles from '../style'
import app from '../clarifai'
import { setPhotoUrl, setPhotoBase64, setPhotoTags } from '../redux/photo'

const Picker = ({ photo, setPhoto, setBase64, setTags }) => {
  let { photoUrl, photoBase64, tags } = photo

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    })

    if (!result.cancelled) {
      const fixedPhotoUrl = result.uri.replace('file://', '')
      setPhoto(fixedPhotoUrl)

      Image.getSize(fixedPhotoUrl, (width, height) => {
        let imageSize = {
          size: { width, height },
          offset: { x: 0, y: 0 }
        }

        // https://github.com/facebook/react-native/issues/12114
        ImageEditor.cropImage(fixedPhotoUrl, imageSize, (imageUri) => {
          ImageStore.getBase64ForTag(imageUri, (base64Data) => {
            setBase64(base64Data)

            app.models.predict(Clarifai.FOOD_MODEL, { base64: base64Data })
            .then((res) => {
              console.log('Clarifai result = ', res);
              let tags = [];
              for (let i = 0; i < res.outputs[0].data.concepts.length; i++) {
                tags.push(res.outputs[0].data.concepts[i].name)
              }
              setTags(tags)
            },
            (error)=>{
              console.log(error);
            });

            ImageStore.removeImageForTag(imageUri);
          }, (reason) => console.log('ERROR 3: ', reason) )
        }, (reason) => console.log('ERROR 2: ', reason) )
      }, (reason) => console.log('ERROR 1: ', reason))
    }
  };

  return (
    <View style={ styles.container }>
      <Button
        title="Pick an image from camera roll"
        onPress={ pickImage }
      />

      { photoUrl
      ? <Image source={{ uri: photoUrl }} style={ styles.image } />
      : <Text>Photo will be shown here</Text> }

      <Text>{ tags.join(' ') }</Text>
    </View>
  )
}


/* -----------------    CONTAINER     ------------------ */

const mapState = ({ photo }) => ({ photo })
const mapDispatch = dispatch => ({
  setPhoto: (photo) => {
    dispatch(setPhotoUrl(photo))
  },
  setBase64: (base64) => {
    dispatch(setPhotoBase64(base64))
  },
  setTags: (tags) => {
    dispatch(setPhotoTags(tags))
  }
})

export default connect(mapState, mapDispatch)(Picker)

// export default class Picker extends React.Component {
//   state = {
//     image: null,
//     tagText: '',
//     pictureBase64: ''
//   };

//   render() {
//     let { image } = this.state;

//     return (
//       <View style={ styles.container }>
//         <Button
//           title="Pick an image from camera roll"
//           onPress={ this._pickImage }
//         />
//         {image &&
//           <Image source={{ uri: image }} style={ styles.image } />}

//         <Text>{this.state.tagText}</Text>
//       </View>
//     );
//   }

  // _pickImage = async () => {
  //   let result = await ImagePicker.launchImageLibraryAsync({
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //   });

  //   if (!result.cancelled) {
  //     this.setState({ image: result.uri.replace('file://', '') });

  //     let imageURL = this.state.image;

  //     Image.getSize(imageURL, (width, height) => {
  //       let imageSize = {
  //         size: { width, height },
  //         offset: { x: 0, y: 0 }
  //       }

  //       // https://github.com/facebook/react-native/issues/12114
  //       ImageEditor.cropImage(imageURL, imageSize, (imageURI) => {
  //         ImageStore.getBase64ForTag(imageURI, (base64Data) => {
  //           this.setState({ pictureBase64: base64Data });

  //           let testBase64 = this.state.pictureBase64
  //           app.models.predict(Clarifai.FOOD_MODEL, { base64: this.state.pictureBase64 })
  //           .then((res) => {
  //             // console.log('Clarifai result = ', res);
  //             let tags = '';
  //             for (let i = 0; i<res.outputs[0].data.concepts.length; i++) {
  //               tags += res.outputs[0].data.concepts[i].name + ' ';
  //             }
  //             this.setState({ tagText: tags });
  //           },
  //           (error)=>{
  //             console.log(error);
  //           });

  //           ImageStore.removeImageForTag(imageURI);
  //         }, (reason) => console.log(reason) )
  //       }, (reason) => console.log(reason) )
  //     }, (reason) => console.log(reason))
  //   }
  // };
// }
