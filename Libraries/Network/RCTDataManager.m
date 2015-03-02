// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTDataManager.h"

#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTDataManager

/**
 * Executes a network request.
 * The responseSender block won't be called on same thread as called.
 */
- (void)executeQuery:(NSString *)queryType
               query:(id)query
           queryHash:(__unused NSString *)queryHash
      responseSender:(RCTResponseSenderBlock)responseSender
{
  RCT_EXPORT(queryData);
    
  if ([queryType isEqualToString:@"http"]) {
    
    // Parse query
    NSDictionary *queryDict = query;
    if ([query isKindOfClass:[NSString class]]) {
      // TODO: it would be more efficient just to send a dictionary
      queryDict = RCTJSONParse(query, NULL);
    }
    
    // Build request
    NSURL *url = [NSURL URLWithString:queryDict[@"url"]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    request.HTTPMethod = queryDict[@"method"] ?: @"GET";
    request.allHTTPHeaderFields = queryDict[@"headers"];
    if ([queryDict[@"data"] isKindOfClass:[NSString class]]) {
      request.HTTPBody = [queryDict[@"data"] dataUsingEncoding:NSUTF8StringEncoding];
    }

    // Build data task
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *connectionError) {
      
      // Build response
      NSDictionary *responseJSON;
      if (connectionError == nil) {
        NSStringEncoding encoding;
        if (response.textEncodingName) {
          CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
          encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
        } else {
          encoding = NSUTF8StringEncoding;
        }
        NSString *returnData = [[NSString alloc] initWithData:data encoding:encoding];
        responseJSON = @{@"status": @200, @"responseText": returnData};
      } else {
        responseJSON = @{@"status": @0, @"responseText": [connectionError localizedDescription]};
      }
      
      // Send response (won't be sent on same thread as caller)
      responseSender(@[RCTJSONStringify(responseJSON, NULL)]);
      
    }];
    
    [task resume];

  } else {
    
    RCTLogMustFix(@"unsupported query type %@", queryType);
    return;
  }
}

@end
