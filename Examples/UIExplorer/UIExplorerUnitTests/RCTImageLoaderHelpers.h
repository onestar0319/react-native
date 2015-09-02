/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#import "RCTImageLoader.h"

typedef BOOL (^RCTImageURLLoaderCanLoadImageURLHandler)(NSURL *requestURL);
typedef RCTImageLoaderCancellationBlock (^RCTImageURLLoaderLoadImageURLHandler)(NSURL *imageURL, CGSize size, CGFloat scale, UIViewContentMode resizeMode, RCTImageLoaderProgressBlock progressHandler, RCTImageLoaderCompletionBlock completionHandler);

@interface RCTConcreteImageURLLoader : NSObject <RCTImageURLLoader>

- (instancetype)initWithPriority:(float)priority
          canLoadImageURLHandler:(RCTImageURLLoaderCanLoadImageURLHandler)canLoadImageURLHandler
             loadImageURLHandler:(RCTImageURLLoaderLoadImageURLHandler)loadImageURLHandler;

@end

typedef BOOL (^RCTImageDecoderCanDecodeImageDataHandler)(NSData *imageData);
typedef RCTImageLoaderCancellationBlock (^RCTImageDecoderDecodeImageDataHandler)(NSData *imageData, CGSize size, CGFloat scale, UIViewContentMode resizeMode, RCTImageLoaderCompletionBlock completionHandler);

@interface RCTConcreteImageDecoder : NSObject <RCTImageDecoder>

- (instancetype)initWithPriority:(float)priority
       canDecodeImageDataHandler:(RCTImageDecoderCanDecodeImageDataHandler)canDecodeImageDataHandler
          decodeImageDataHandler:(RCTImageDecoderDecodeImageDataHandler)decodeImageDataHandler;

@end

#define _RCTDefineImageHandler(SUPERCLASS, CLASS_NAME) \
@interface CLASS_NAME : SUPERCLASS @end \
@implementation CLASS_NAME RCT_EXPORT_MODULE() @end

#define RCTDefineImageURLLoader(CLASS_NAME) \
_RCTDefineImageHandler(RCTConcreteImageURLLoader, CLASS_NAME)

#define RCTDefineImageDecoder(CLASS_NAME) \
_RCTDefineImageHandler(RCTConcreteImageDecoder, CLASS_NAME)
