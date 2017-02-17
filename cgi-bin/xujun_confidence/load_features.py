import os
import sys
import lmdb
import numpy as np

def get_subject_id( image_key ) :
    """parse CS3 subject id from image key
    """
    return  int( image_key.split('_')[0] )


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


def load_facial_feature( featex_lmdb, valid_keys = None ):
    env = lmdb.open( featex_lmdb, readonly = True )
    feat_arr, feat_keys, feat_ids = [], [], []
    nb_samples = 0

    with env.begin() as txn:
        if ( valid_keys is not None ) :
            print "INFO: only load valid keys of length", len( valid_keys )
            for image_key in valid_keys :
                id = get_subject_id( image_key )
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
                nb_samples += 1
    # print some stats
    return np.row_stack( feat_arr ), feat_keys, feat_ids

'''
key_file = '/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceClustering-selfeval-proto02/expts/partition/partition_render-45.list'
my_lmdb  = '/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceFeatex-selfeval-proto02/expts/features/raw-features-CS3-render-45.lmdb'
keys = load_valid_keys( key_file )
feat, keys, ids = load_facial_feature( my_lmdb, keys )
'''
