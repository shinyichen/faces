import os
import lmdb
import numpy as np
from scipy.stats import mode
from datetime import datetime
from scipy.cluster.hierarchy import linkage
from sklearn.cluster import AffinityPropagation
from sklearn.metrics import adjusted_mutual_info_score, normalized_mutual_info_score, adjusted_rand_score, homogeneity_score, completeness_score, silhouette_score, pairwise_distances

####################################################################################################
# Parse parameters
####################################################################################################
use_key_image_file = "/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceClustering-selfeval-proto08/expts/partition/partition_render-45.list"
use_feat_lmdb = "/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceFeatex-selfeval-proto08/expts/features/raw-features-CS3-render-45.lmdb"
metric = "cosine"
output_file = "/nfs/div2/jchen/features/output/features.txt"
output_label = "/nfs/div2/jchen/features/output/labels.txt"
output_img = "/nfs/div2/jchen/features/output/img.txt"
max_iter = 100
normalization = True
rank = -1


if ( rank > 99 or rank < 1) :
    self_simi = False
else :
    self_simi = True

# localize lmdb
my_feat_lmdb = os.path.join( os.environ['TMPDIR'], os.path.basename( use_feat_lmdb ) )
if ( not os.path.isdir( my_feat_lmdb ) ) :
   os.system( 'cp -rf %s %s' % ( use_feat_lmdb, my_feat_lmdb ) )
   print "INFO: successfully localize data lmdb to", my_feat_lmdb

####################################################################################################
# Main Clustering
####################################################################################################
def get_subject_id( image_key ) :
    """parse CS3 subject id from image key
    """
    return  int( image_key.split('_')[0] )

def get_image_id( image_key ) :
    """parse CS3 image path from image key
        """
    img = image_key.split('_')[1].replace('-', '/')
    # if (img.startswith('img')) :
    #     img = img + '.jpg'
    # if (img.startswith('frames')) :
    #     img = img + '.png'

    return img

def load_face_features( featex_lmdb, valid_keys = None ) :
    '''Load face features from RUNJOB experiment
    INPUT:
        featex_lmdb = string, path to CS3 LMDB dir
        valid_keys = list, [ keys ]; when None, use all keys
    OUTPTU:
        feat_arr = np.array,
    '''
    env = lmdb.open( featex_lmdb, readonly = True )
    feat_arr, feat_keys, feat_ids, feat_imgs = [], [], [], []
    nb_samples = 0
    with env.begin() as txn:
        if ( valid_keys is not None ) :
            print "INFO: only load valid keys of length", len( valid_keys )
            for image_key in valid_keys :
                id = get_subject_id( image_key )
                img = get_image_id( image_key )
                # try to load feature
                try :
                    value = txn.get( image_key )
                    f = np.frombuffer( value, dtype = np.float32 )
                except Exception, e :
                    print "WARNING: fail to load feature", image_key, e
                    continue
                # if success, we update
                feat_arr.append( f )
                feat_keys.append( image_key )
                feat_ids.append( id )
                feat_imgs.append( img )
                nb_samples += 1
        else :
            print "INFO: load all available keys"
            cursor = txn.cursor()
            for image_key, value in cursor() :
                id = get_subject_id( image_key )
                # try to load feature
                try :
                    f = np.frombuffer( value, dtype = np.float32 )
                except Exception, e :
                    print "WARNING: fail to load feature", image_key, e
                    continue
                # if success, we update
                feat_arr.append( f )
                feat_keys.append( image_key )
                feat_ids.append( id )
                feat_imgs.append( img )
                nb_samples += 1
    # print some stats
    return np.row_stack( feat_arr ), feat_keys, feat_ids, feat_imgs

def data_normalization( X ) :
    '''Apply data normalization
    Once this normalization is done, then cosine distance is equivalent to pearson correlation coefficient
    i.e. cosine_dist = 1 - pearson_coef
    '''
    avg = X.mean( axis = 1, keepdims = True )
    std = np.maximum( X.std( axis = 1, keepdims = True ), 1e-5 )
    return ( X - avg ) / std

def time_stamp( message ) :
    print message, datetime.now()

def line_breaker() :
    print "-" * 100

def load_valid_keys( use_key_image_file ) :
    if ( os.path.isfile( use_key_image_file ) ) :
        with open( use_key_image_file, 'r' ) as IN :
            lines = [ line.strip() for line in IN.readlines() ]
        valid_keys = dict()
        for line in lines :
            fields = filter( None, line.split(',') )
            if ( len( fields ) == 2  ) :
                key, image_file = fields
            elif ( len( fields) == 1 ) :
                key = fields[0]
            else :
                print "WARNING: unknown format of key_image_file", line
                continue
            valid_keys[ key ] = 1
        return valid_keys.keys()
    else :
        print "WARNING: cannot find valid key file", use_key_image_file
        print "WARNING: use all available keys anyway"
        return None

def clustering_with_affinity_propagation( X, y_true, self_simi = False, rank = 50, max_iter = 50 ):
    line_breaker()
    time_stamp( "begin affinity propagation" )
    D = pairwise_distances( X, metric = 'cosine' )
    if ( self_simi ) :
        preference = np.percentile( -D, rank, axis = 1 )
        print "INFO: use preference = one v.s. rest median"
    else :
        preference = None
    model = AffinityPropagation( affinity = 'precomputed', verbose = True, max_iter = max_iter, preference = preference )
    y_pred = model.fit_predict( -D )
    time_stamp( "nb_predicted_clusters = %s" % np.unique( y_pred ).size )
    affinity_score = evaluate_clustering_performance( y_true, y_pred )
    time_stamp( "affinity_score = %s" % affinity_score )
    return y_pred

def evaluate_clustering_performance( y_true, y_pred ) :
    ars = adjusted_rand_score( y_true, y_pred )
    nmi = normalized_mutual_info_score( y_true, y_pred )
    ami = adjusted_mutual_info_score( y_true, y_pred )
    hs = homogeneity_score( y_true, y_pred )
    cs = completeness_score( y_true, y_pred )
    f = 1./ np.mean( [ 1./hs, 1./cs ] )
    return np.array( [ ars, nmi, ami, hs, cs, f ] )

def compute_stats( feats, avg = None ) :
    if ( avg is None ) :
        avg = feats.mean( axis = 0, keepdims = True )
    div = pairwise_distances( feats, avg, metric = 'cosine' )
    return [ np.percentile( div, r ) for r in [1] + range( 10, 100, 10 ) + [99] ]

# 1. load valid keys and corresponding features
valid_keys = load_valid_keys( use_key_image_file )
time_stamp( "INFO: load %d valid keys" % len( valid_keys ) )
feat_arr, feat_keys, feat_ids, feat_imgs = load_face_features( my_feat_lmdb, valid_keys )
time_stamp( "INFO: load feat_arr.shape =%s" % str(feat_arr.shape ) )
time_stamp( "INFO: #total subjects =%d" % np.unique( feat_ids ).size )
line_breaker()

np.savetxt(output_file, feat_arr, delimiter=',');
np.savetxt(output_label, feat_ids, fmt='%i', delimiter='\n');
np.savetxt(output_img, feat_imgs, fmt='%s', delimiter='\n');
