/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = require('Platform');
var React = require('react');
var createReactClass = require('create-react-class');
var ReactNative = require('react-native');
var {
  Image,
  Text,
  TextInput,
  View,
  LayoutAnimation,
  Button,
  Picker,
} = ReactNative;

type TextAlignExampleRTLState = {|
  isRTL: boolean,
|};

class TextAlignRTLExample extends React.Component<*, TextAlignExampleRTLState> {
  constructor(...args: Array<*>) {
    super(...args);

    this.state = {
      isRTL: false,
    };
  }

  render() {
    const {isRTL} = this.state;
    const toggleRTL = () => this.setState({isRTL: !isRTL});
    return (
      <View style={{direction: isRTL ? 'rtl' : 'ltr'}}>
        <Text>auto (default) - english LTR</Text>
        <Text>
          {'\u0623\u062D\u0628 \u0627\u0644\u0644\u063A\u0629 ' +
            '\u0627\u0644\u0639\u0631\u0628\u064A\u0629 auto (default) - arabic RTL'}
        </Text>
        <Text style={{textAlign: 'left'}}>
          left left left left left left left left left left left left left left
          left
        </Text>
        <Text style={{textAlign: 'center'}}>
          center center center center center center center center center center
          center
        </Text>
        <Text style={{textAlign: 'right'}}>
          right right right right right right right right right right right
          right right
        </Text>
        <Text style={{textAlign: 'justify'}}>
          justify: this text component{"'"}s contents are laid out with
          "textAlign: justify" and as you can see all of the lines except the
          last one span the available width of the parent container.
        </Text>
        <Button
          onPress={toggleRTL}
          title={`Switch to ${isRTL ? 'LTR' : 'RTL'}`}
        />
      </View>
    );
  }
}

class Entity extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <Text style={{fontWeight: '500', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
}

class AttributeToggler extends React.Component<{}, $FlowFixMeState> {
  state = {fontWeight: 'bold', fontSize: 15};

  toggleWeight = () => {
    this.setState({
      fontWeight: this.state.fontWeight === 'bold' ? 'normal' : 'bold',
    });
  };

  increaseSize = () => {
    this.setState({
      fontSize: this.state.fontSize + 1,
    });
  };

  render() {
    var curStyle = {
      fontWeight: this.state.fontWeight,
      fontSize: this.state.fontSize,
    };
    return (
      <View>
        <Text style={curStyle}>
          Tap the controls below to change attributes.
        </Text>
        <Text>
          <Text>
            See how it will even work on{' '}
            <Text style={curStyle}>this nested text</Text>
          </Text>
        </Text>
        <Text
          style={{backgroundColor: '#ffaaaa', marginTop: 5}}
          onPress={this.toggleWeight}>
          Toggle Weight
        </Text>
        <Text
          style={{backgroundColor: '#aaaaff', marginTop: 5}}
          onPress={this.increaseSize}>
          Increase Size
        </Text>
      </View>
    );
  }
}

var AdjustingFontSize = createReactClass({
  displayName: 'AdjustingFontSize',
  getInitialState: function() {
    return {dynamicText: '', shouldRender: true};
  },
  reset: function() {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      shouldRender: false,
    });
    setTimeout(() => {
      LayoutAnimation.easeInEaseOut();
      this.setState({
        dynamicText: '',
        shouldRender: true,
      });
    }, 300);
  },
  addText: function() {
    this.setState({
      dynamicText:
        this.state.dynamicText +
        (Math.floor((Math.random() * 10) % 2) ? ' foo' : ' bar'),
    });
  },
  removeText: function() {
    this.setState({
      dynamicText: this.state.dynamicText.slice(
        0,
        this.state.dynamicText.length - 4,
      ),
    });
  },
  render: function() {
    if (!this.state.shouldRender) {
      return <View />;
    }
    return (
      <View>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{fontSize: 36, marginVertical: 6}}>
          Truncated text is baaaaad.
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{fontSize: 40, marginVertical: 6}}>
          Shrinking to fit available space is much better!
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{fontSize: 30, marginVertical: 6}}>
          {'Add text to me to watch me shrink!' + ' ' + this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={4}
          style={{fontSize: 20, marginVertical: 6}}>
          {'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{marginVertical: 6}}>
          <Text style={{fontSize: 14}}>
            {'Differently sized nested elements will shrink together. '}
          </Text>
          <Text style={{fontSize: 20}}>
            {'LARGE TEXT! ' + this.state.dynamicText}
          </Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 5,
            marginVertical: 6,
          }}>
          <Text style={{backgroundColor: '#ffaaaa'}} onPress={this.reset}>
            Reset
          </Text>
          <Text style={{backgroundColor: '#aaaaff'}} onPress={this.removeText}>
            Remove Text
          </Text>
          <Text style={{backgroundColor: '#aaffaa'}} onPress={this.addText}>
            Add Text
          </Text>
        </View>
      </View>
    );
  },
});

class TextBaseLineLayoutExample extends React.Component<*, *> {
  render() {
    var texts = [];
    for (var i = 9; i >= 0; i--) {
      texts.push(
        <Text key={i} style={{fontSize: 8 + i * 5, backgroundColor: '#eee'}}>
          {i}
        </Text>,
      );
    }

    const marker = (
      <View style={{width: 20, height: 20, backgroundColor: 'gray'}} />
    );
    const subtitleStyle = {fontSize: 16, marginTop: 8, fontWeight: 'bold'};

    return (
      <View>
        <Text style={subtitleStyle}>{'Nested <Text/>s:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          <Text>{texts}</Text>
          {marker}
        </View>

        <Text style={subtitleStyle}>{'Array of <Text/>s in <View>:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          {texts}
          {marker}
        </View>

        <Text style={subtitleStyle}>{'<TextInput/>:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          <TextInput style={{margin: 0, padding: 0}}>{texts}</TextInput>
          {marker}
        </View>

        <Text style={subtitleStyle}>{'<TextInput multiline/>:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          <TextInput multiline={true} style={{margin: 0, padding: 0}}>
            {texts}
          </TextInput>
          {marker}
        </View>
      </View>
    );
  }
}

class TextRenderInfoExample extends React.Component<*, *> {
  state = {
    textMetrics: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      capHeight: 0,
      descender: 0,
      ascender: 0,
      xHeight: 0,
    },
    numberOfTextBlocks: 1,
    fontSize: 14,
  };

  render() {
    const topOfBox =
      this.state.textMetrics.y +
      this.state.textMetrics.height -
      (this.state.textMetrics.descender + this.state.textMetrics.capHeight);
    return (
      <View>
        <View>
          <View
            style={{
              position: 'absolute',
              left: this.state.textMetrics.x + this.state.textMetrics.width,
              top: topOfBox,
              width: 5,
              height: Math.ceil(
                this.state.textMetrics.capHeight -
                  this.state.textMetrics.xHeight,
              ),
              backgroundColor: 'red',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: this.state.textMetrics.x + this.state.textMetrics.width,
              top:
                topOfBox +
                (this.state.textMetrics.capHeight -
                  this.state.textMetrics.xHeight),
              width: 5,
              height: Math.ceil(this.state.textMetrics.xHeight),
              backgroundColor: 'green',
            }}
          />
          <Text
            style={{fontSize: this.state.fontSize}}
            onTextLayout={event => {
              const {lines} = event.nativeEvent;
              if (lines.length > 0) {
                this.setState({textMetrics: lines[lines.length - 1]});
              }
            }}>
            {new Array(this.state.numberOfTextBlocks)
              .fill('A tiny block of text.')
              .join(' ')}
          </Text>
        </View>
        <Text
          onPress={() =>
            this.setState({
              numberOfTextBlocks: this.state.numberOfTextBlocks + 1,
            })
          }>
          More text
        </Text>
        <Text
          onPress={() => this.setState({fontSize: this.state.fontSize + 1})}>
          Increase size
        </Text>
        <Text
          onPress={() => this.setState({fontSize: this.state.fontSize - 1})}>
          Decrease size
        </Text>
      </View>
    );
  }
}

class TextWithCapBaseBox extends React.Component<*, *> {
  state = {
    textMetrics: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      capHeight: 0,
      descender: 0,
      ascender: 0,
      xHeight: 0,
    },
  };
  render() {
    return (
      <Text
        onTextLayout={event => {
          const {lines} = event.nativeEvent;
          if (lines.length > 0) {
            this.setState({textMetrics: lines[0]});
          }
        }}
        style={[
          {
            marginTop: Math.ceil(
              -(
                this.state.textMetrics.ascender -
                this.state.textMetrics.capHeight
              ),
            ),
            marginBottom: Math.ceil(-this.state.textMetrics.descender),
          },
          this.props.style,
        ]}>
        {this.props.children}
      </Text>
    );
  }
}

class TextLegend extends React.Component<*, *> {
  state = {
    textMetrics: [],
    language: 'english',
  };

  render() {
    const PANGRAMS = {
      arabic:
        'صِف خَلقَ خَودِ كَمِثلِ الشَمسِ إِذ بَزَغَت — يَحظى الضَجيعُ بِها نَجلاءَ مِعطارِ',
      chinese: 'Innovation in China 中国智造，慧及全球 0123456789',
      english: 'The quick brown fox jumps over the lazy dog.',
      emoji: '🙏🏾🚗💩😍🤯👩🏽‍🔧🇨🇦💯',
      german: 'Falsches Üben von Xylophonmusik quält jeden größeren Zwerg',
      greek: 'Ταχίστη αλώπηξ βαφής ψημένη γη, δρασκελίζει υπέρ νωθρού κυνός',
      hebrew: 'דג סקרן שט בים מאוכזב ולפתע מצא חברה',
      hindi:
        'ऋषियों को सताने वाले दुष्ट राक्षसों के राजा रावण का सर्वनाश करने वाले विष्णुवतार भगवान श्रीराम, अयोध्या के महाराज दशरथ के बड़े सपुत्र थे।',
      igbo:
        'Nne, nna, wepụ he’l’ụjọ dum n’ime ọzụzụ ụmụ, vufesi obi nye Chukwu, ṅụrịanụ, gbakọọnụ kpaa, kwee ya ka o guzoshie ike; ọ ghaghị ito, nwapụta ezi agwa',
      irish:
        'D’fhuascail Íosa Úrmhac na hÓighe Beannaithe pór Éava agus Ádhaimh',
      japanese:
        '色は匂へど 散りぬるを 我が世誰ぞ 常ならむ 有為の奥山 今日越えて 浅き夢見じ 酔ひもせず',
      korean:
        '키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다',
      norwegian:
        'Vår sære Zulu fra badeøya spilte jo whist og quickstep i min taxi.',
      polish: 'Jeżu klątw, spłódź Finom część gry hańb!',
      romanian: 'Muzicologă în bej vând whisky și tequila, preț fix.',
      russian: 'Эх, чужак, общий съём цен шляп (юфть) – вдрызг!',
      swedish: 'Yxskaftbud, ge vår WC-zonmö IQ-hjälp.',
      thai:
        'เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฝูงสัตว์เดรัจฉาน จงฝ่าฟันพัฒนาวิชาการ อย่าล้างผลาญฤๅเข่นฆ่าบีฑาใคร ไม่ถือโทษโกรธแช่งซัดฮึดฮัดด่า หัดอภัยเหมือนกีฬาอัชฌาสัย ปฏิบัติประพฤติกฎกำหนดใจ พูดจาให้จ๊ะๆ จ๋าๆ น่าฟังเอยฯ',
    };
    return (
      <View>
        <Picker
          selectedValue={this.state.language}
          onValueChange={itemValue => this.setState({language: itemValue})}>
          {Object.keys(PANGRAMS).map(x => (
            <Picker.Item
              label={x[0].toUpperCase() + x.substring(1)}
              key={x}
              value={x}
            />
          ))}
        </Picker>
        <View>
          {this.state.textMetrics.map(
            ({
              x,
              y,
              width,
              height,
              capHeight,
              ascender,
              descender,
              xHeight,
            }) => {
              return [
                <View
                  key="baseline view"
                  style={{
                    top: y + ascender,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'red',
                  }}
                />,
                <Text
                  key="baseline text"
                  style={{
                    top: y + ascender,
                    right: 0,
                    position: 'absolute',
                    color: 'red',
                  }}>
                  Baseline
                </Text>,
                <View
                  key="capheight view"
                  style={{
                    top: y + ascender - capHeight,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'green',
                  }}
                />,
                <Text
                  key="capheight text"
                  style={{
                    top: y + ascender - capHeight,
                    right: 0,
                    position: 'absolute',
                    color: 'green',
                  }}>
                  Capheight
                </Text>,
                <View
                  key="xheight view"
                  style={{
                    top: y + ascender - xHeight,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'blue',
                  }}
                />,
                <Text
                  key="xheight text"
                  style={{
                    top: y + ascender - xHeight,
                    right: 0,
                    position: 'absolute',
                    color: 'blue',
                  }}>
                  X-height
                </Text>,
                <View
                  key="descender view"
                  style={{
                    top: y + ascender + descender,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'orange',
                  }}
                />,
                <Text
                  key="descender text"
                  style={{
                    top: y + ascender + descender,
                    right: 0,
                    position: 'absolute',
                    color: 'orange',
                  }}>
                  Descender
                </Text>,
                <View
                  key="end of text view"
                  style={{
                    top: y,
                    height: height,
                    width: 1,
                    left: x + width,
                    position: 'absolute',
                    backgroundColor: 'brown',
                  }}
                />,
                <Text
                  key="end of text text"
                  style={{
                    top: y,
                    left: x + width + 5,
                    position: 'absolute',
                    color: 'brown',
                  }}>
                  End of text
                </Text>,
              ];
            },
          )}
          <Text
            onTextLayout={event =>
              this.setState({textMetrics: event.nativeEvent.lines})
            }
            style={{fontSize: 50}}>
            {PANGRAMS[this.state.language]}
          </Text>
        </View>
      </View>
    );
  }
}
exports.title = '<Text>';
exports.description = 'Base component for rendering styled text.';
exports.displayName = 'TextExample';
exports.examples = [
  {
    title: 'Wrap',
    render: function() {
      return (
        <Text>
          The text should wrap if it goes on multiple lines. See, this is going
          to the next line.
        </Text>
      );
    },
  },
  {
    title: 'Text metrics',
    render: function() {
      return <TextRenderInfoExample />;
    },
  },
  {
    title: 'Text metrics legend',
    render: () => <TextLegend />,
  },
  {
    title: 'Baseline capheight box',
    render: () => (
      <View style={{backgroundColor: 'red'}}>
        <TextWithCapBaseBox>Some example text.</TextWithCapBaseBox>
      </View>
    ),
  },
  {
    title: 'Padding',
    render: function() {
      return (
        <Text style={{padding: 10}}>
          This text is indented by 10px padding on all sides.
        </Text>
      );
    },
  },
  {
    title: 'Font Family',
    render: function() {
      return (
        <View>
          <Text style={{fontFamily: Platform.isTV ? 'Times' : 'Cochin'}}>
            Cochin
          </Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Times' : 'Cochin',
              fontWeight: 'bold',
            }}>
            Cochin bold
          </Text>
          <Text style={{fontFamily: 'Helvetica'}}>Helvetica</Text>
          <Text style={{fontFamily: 'Helvetica', fontWeight: 'bold'}}>
            Helvetica bold
          </Text>
          <Text style={{fontFamily: Platform.isTV ? 'Courier' : 'Verdana'}}>
            Verdana
          </Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Courier' : 'Verdana',
              fontWeight: 'bold',
            }}>
            Verdana bold
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Font Size',
    render: function() {
      return (
        <View>
          <Text style={{fontSize: 23}}>Size 23</Text>
          <Text style={{fontSize: 8}}>Size 8</Text>
        </View>
      );
    },
  },
  {
    title: 'Color',
    render: function() {
      return (
        <View>
          <Text style={{color: 'red'}}>Red color</Text>
          <Text style={{color: 'blue'}}>Blue color</Text>
        </View>
      );
    },
  },
  {
    title: 'Font Weight',
    render: function() {
      return (
        <View>
          <Text style={{fontSize: 20, fontWeight: '100'}}>
            Move fast and be ultralight
          </Text>
          <Text style={{fontSize: 20, fontWeight: '200'}}>
            Move fast and be light
          </Text>
          <Text style={{fontSize: 20, fontWeight: 'normal'}}>
            Move fast and be normal
          </Text>
          <Text style={{fontSize: 20, fontWeight: 'bold'}}>
            Move fast and be bold
          </Text>
          <Text style={{fontSize: 20, fontWeight: '900'}}>
            Move fast and be ultrabold
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Font Style',
    render: function() {
      return (
        <View>
          <Text style={{fontStyle: 'normal'}}>Normal text</Text>
          <Text style={{fontStyle: 'italic'}}>Italic text</Text>
        </View>
      );
    },
  },
  {
    title: 'Selectable',
    render: function() {
      return (
        <View>
          <Text selectable={true}>
            This text is <Text style={{fontWeight: 'bold'}}>selectable</Text> if
            you click-and-hold.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text Decoration',
    render: function() {
      return (
        <View>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'solid',
            }}>
            Solid underline
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'double',
              textDecorationColor: '#ff0000',
            }}>
            Double underline with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'dashed',
              textDecorationColor: '#9CDC40',
            }}>
            Dashed underline with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationColor: 'blue',
            }}>
            Dotted underline with custom color
          </Text>
          <Text style={{textDecorationLine: 'none'}}>None textDecoration</Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'solid',
            }}>
            Solid line-through
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'double',
              textDecorationColor: '#ff0000',
            }}>
            Double line-through with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'dashed',
              textDecorationColor: '#9CDC40',
            }}>
            Dashed line-through with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'dotted',
              textDecorationColor: 'blue',
            }}>
            Dotted line-through with custom color
          </Text>
          <Text style={{textDecorationLine: 'underline line-through'}}>
            Both underline and line-through
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Nested',
    description:
      'Nested text components will inherit the styles of their ' +
      'parents (only backgroundColor is inherited from non-Text parents).  ' +
      '<Text> only supports other <Text> and raw text (strings) as children.',
    render: function() {
      return (
        <View>
          <Text>
            (Normal text,
            <Text style={{fontWeight: 'bold'}}>
              (and bold
              <Text style={{fontSize: 11, color: '#527fe4'}}>
                (and tiny inherited bold blue)
              </Text>
              )
            </Text>
            )
          </Text>
          <Text style={{opacity: 0.7}}>
            (opacity
            <Text>
              (is inherited
              <Text style={{opacity: 0.7}}>
                (and accumulated
                <Text style={{backgroundColor: '#ffaaaa'}}>
                  (and also applies to the background)
                </Text>
                )
              </Text>
              )
            </Text>
            )
          </Text>
          <Text style={{fontSize: 12}}>
            <Entity>Entity Name</Entity>
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text Align',
    render: function() {
      return (
        <View>
          <Text>auto (default) - english LTR</Text>
          <Text>
            {'\u0623\u062D\u0628 \u0627\u0644\u0644\u063A\u0629 ' +
              '\u0627\u0644\u0639\u0631\u0628\u064A\u0629 auto (default) - arabic ' +
              'RTL'}
          </Text>
          <Text style={{textAlign: 'left'}}>
            left left left left left left left left left left left left left
            left left
          </Text>
          <Text style={{textAlign: 'center'}}>
            center center center center center center center center center
            center center
          </Text>
          <Text style={{textAlign: 'right'}}>
            right right right right right right right right right right right
            right right
          </Text>
          <Text style={{textAlign: 'justify'}}>
            justify: this text component{"'"}s contents are laid out with
            "textAlign: justify" and as you can see all of the lines except the
            last one span the available width of the parent container.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Letter Spacing',
    render: function() {
      return (
        <View>
          <Text style={{letterSpacing: 0}}>letterSpacing = 0</Text>
          <Text style={{letterSpacing: 2, marginTop: 5}}>
            letterSpacing = 2
          </Text>
          <Text style={{letterSpacing: 9, marginTop: 5}}>
            letterSpacing = 9
          </Text>
          <View style={{flexDirection: 'row'}}>
            <Text
              style={{
                fontSize: 12,
                letterSpacing: 2,
                backgroundColor: 'fuchsia',
                marginTop: 5,
              }}>
              With size and background color
            </Text>
          </View>
          <Text style={{letterSpacing: -1, marginTop: 5}}>
            letterSpacing = -1
          </Text>
          <Text
            style={{
              letterSpacing: 3,
              backgroundColor: '#dddddd',
              marginTop: 5,
            }}>
            [letterSpacing = 3]
            <Text style={{letterSpacing: 0, backgroundColor: '#bbbbbb'}}>
              [Nested letterSpacing = 0]
            </Text>
            <Text style={{letterSpacing: 6, backgroundColor: '#eeeeee'}}>
              [Nested letterSpacing = 6]
            </Text>
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Spaces',
    render: function() {
      return (
        <Text>
          A {'generated'} {'string'} and some &nbsp;&nbsp;&nbsp; spaces
        </Text>
      );
    },
  },
  {
    title: 'Line Height',
    render: function() {
      return (
        <Text>
          <Text style={{lineHeight: 35}}>
            A lot of space between the lines of this long passage that should
            wrap once.
          </Text>
        </Text>
      );
    },
  },
  {
    title: 'Empty Text',
    description: "It's ok to have Text with zero or null children.",
    render: function() {
      return <Text />;
    },
  },
  {
    title: 'Toggling Attributes',
    render: function(): React.Element<any> {
      return <AttributeToggler />;
    },
  },
  {
    title: 'backgroundColor attribute',
    description: 'backgroundColor is inherited from all types of views.',
    render: function() {
      return (
        <Text style={{backgroundColor: 'yellow'}}>
          Yellow container background,
          <Text style={{backgroundColor: '#ffaaaa'}}>
            {' '}
            red background,
            <Text style={{backgroundColor: '#aaaaff'}}>
              {' '}
              blue background,
              <Text>
                {' '}
                inherited blue background,
                <Text style={{backgroundColor: '#aaffaa'}}>
                  {' '}
                  nested green background.
                </Text>
              </Text>
            </Text>
          </Text>
        </Text>
      );
    },
  },
  {
    title: 'numberOfLines attribute',
    render: function() {
      return (
        <View>
          <Text numberOfLines={1}>
            Maximum of one line, no matter how much I write here. If I keep
            writing, it{"'"}ll just truncate after one line.
          </Text>
          <Text numberOfLines={2} style={{marginTop: 20}}>
            Maximum of two lines, no matter how much I write here. If I keep
            writing, it{"'"}ll just truncate after two lines.
          </Text>
          <Text style={{marginTop: 20}}>
            No maximum lines specified, no matter how much I write here. If I
            keep writing, it{"'"}ll just keep going and going.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text highlighting (tap the link to see highlight)',
    render: function() {
      return (
        <View>
          <Text>
            Lorem ipsum dolor sit amet,{' '}
            <Text
              suppressHighlighting={false}
              style={{
                backgroundColor: 'white',
                textDecorationLine: 'underline',
                color: 'blue',
              }}
              onPress={() => null}>
              consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua. Ut enim ad minim veniam, quis
              nostrud
            </Text>{' '}
            exercitation ullamco laboris nisi ut aliquip ex ea commodo
            consequat.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'allowFontScaling attribute',
    render: function() {
      return (
        <View>
          <Text>
            By default, text will respect Text Size accessibility setting on
            iOS. It means that all font sizes will be increased or descreased
            depending on the value of Text Size setting in{' '}
            <Text style={{fontWeight: 'bold'}}>
              Settings.app - Display & Brightness - Text Size
            </Text>
          </Text>
          <Text style={{marginTop: 10}}>
            You can disable scaling for your Text component by passing {'"'}allowFontScaling={
              '{'
            }false{'}"'} prop.
          </Text>
          <Text allowFontScaling={false} style={{marginTop: 20}}>
            This text will not scale.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text shadow',
    render: function() {
      return (
        <View>
          <Text
            style={{
              fontSize: 20,
              textShadowOffset: {width: 2, height: 2},
              textShadowRadius: 1,
              textShadowColor: '#00cccc',
            }}>
            Demo text shadow
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Ellipsize mode',
    render: function() {
      return (
        <View>
          <Text numberOfLines={1}>
            This very long text should be truncated with dots in the end.
          </Text>
          <Text ellipsizeMode="middle" numberOfLines={1}>
            This very long text should be truncated with dots in the middle.
          </Text>
          <Text ellipsizeMode="head" numberOfLines={1}>
            This very long text should be truncated with dots in the beginning.
          </Text>
          <Text ellipsizeMode="clip" numberOfLines={1}>
            This very looooooooooooooooooooooooooooong text should be clipped.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Font variants',
    render: function() {
      return (
        <View>
          <Text style={{fontVariant: ['small-caps']}}>Small Caps{'\n'}</Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Times' : 'Hoefler Text',
              fontVariant: ['oldstyle-nums'],
            }}>
            Old Style nums 0123456789{'\n'}
          </Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Times' : 'Hoefler Text',
              fontVariant: ['lining-nums'],
            }}>
            Lining nums 0123456789{'\n'}
          </Text>
          <Text style={{fontVariant: ['tabular-nums']}}>
            Tabular nums{'\n'}
            1111{'\n'}
            2222{'\n'}
          </Text>
          <Text style={{fontVariant: ['proportional-nums']}}>
            Proportional nums{'\n'}
            1111{'\n'}
            2222{'\n'}
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Dynamic Font Size Adjustment',
    render: function(): React.Element<any> {
      return <AdjustingFontSize />;
    },
  },
  {
    title: 'Text Align with RTL',
    render: function() {
      return <TextAlignRTLExample />;
    },
  },
  {
    title: "Text `alignItems: 'baseline'` style",
    render: function() {
      return <TextBaseLineLayoutExample />;
    },
  },
  {
    title: 'Transform',
    render: function() {
      return (
        <View>
          <Text style={{textTransform: 'uppercase'}}>
            This text should be uppercased.
          </Text>
          <Text style={{textTransform: 'lowercase'}}>
            This TEXT SHOULD be lowercased.
          </Text>
          <Text style={{textTransform: 'capitalize'}}>
            This text should be CAPITALIZED.
          </Text>
          <Text style={{textTransform: 'capitalize'}}>
            Mixed: <Text style={{textTransform: 'uppercase'}}>uppercase </Text>
            <Text style={{textTransform: 'lowercase'}}>LoWeRcAsE </Text>
            <Text style={{textTransform: 'capitalize'}}>
              capitalize each word
            </Text>
          </Text>
          <Text>
            Should be "ABC":
            <Text style={{textTransform: 'uppercase'}}>
              a<Text>b</Text>c
            </Text>
          </Text>
          <Text>
            Should be "AbC":
            <Text style={{textTransform: 'uppercase'}}>
              a<Text style={{textTransform: 'none'}}>b</Text>c
            </Text>
          </Text>
        </View>
      );
    },
  },
];
